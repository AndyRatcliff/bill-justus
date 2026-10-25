import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { pickSocialUrl } from './social'

const PINK = new THREE.Color('#ff2d8a')
const CYAN = new THREE.Color('#2de8ff')
/** Radians per second — slow, constant auto-spin */
const SPIN_SPEED = 0.12

/** Equirectangular land mask used to densify continents */
function createLandMask() {
  const w = 1024
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#fff'

  const blobs = [
    [[0.3, 0.12], [0.36, 0.08], [0.4, 0.14], [0.36, 0.2], [0.3, 0.18]],
    [
      [0.12, 0.2], [0.18, 0.14], [0.26, 0.16], [0.32, 0.22], [0.34, 0.32],
      [0.3, 0.42], [0.24, 0.46], [0.18, 0.4], [0.14, 0.32], [0.1, 0.26],
    ],
    [[0.24, 0.46], [0.28, 0.48], [0.3, 0.52], [0.28, 0.54], [0.24, 0.5]],
    [
      [0.26, 0.52], [0.32, 0.5], [0.36, 0.56], [0.34, 0.68], [0.3, 0.78],
      [0.26, 0.72], [0.24, 0.6],
    ],
    [
      [0.46, 0.2], [0.52, 0.18], [0.56, 0.2], [0.58, 0.28], [0.54, 0.34],
      [0.48, 0.32], [0.46, 0.26],
    ],
    [
      [0.46, 0.36], [0.54, 0.34], [0.58, 0.42], [0.56, 0.56], [0.52, 0.66],
      [0.48, 0.62], [0.44, 0.5], [0.44, 0.4],
    ],
    [
      [0.58, 0.16], [0.7, 0.14], [0.82, 0.18], [0.88, 0.26], [0.84, 0.36],
      [0.74, 0.42], [0.64, 0.4], [0.58, 0.32],
    ],
    [[0.68, 0.4], [0.72, 0.4], [0.74, 0.5], [0.7, 0.52], [0.68, 0.46]],
    [[0.76, 0.46], [0.84, 0.46], [0.86, 0.54], [0.8, 0.56], [0.76, 0.5]],
    [[0.78, 0.6], [0.88, 0.58], [0.92, 0.66], [0.86, 0.74], [0.78, 0.7]],
  ]

  for (const blob of blobs) {
    ctx.beginPath()
    blob.forEach(([x, y], i) => {
      const px = x * w
      const py = y * h
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    ctx.closePath()
    ctx.fill()
  }

  ctx.filter = 'blur(4px)'
  ctx.drawImage(canvas, 0, 0)
  return ctx.getImageData(0, 0, w, h)
}

function sampleLand(imageData, u, v) {
  const x = Math.floor((((u % 1) + 1) % 1) * (imageData.width - 1))
  const y = Math.floor(Math.min(Math.max(v, 0), 1) * (imageData.height - 1))
  const i = (y * imageData.width + x) * 4
  return imageData.data[i] / 255
}

function latLonToVector3(lat, lon, radius) {
  const phi = THREE.MathUtils.degToRad(90 - lat)
  const theta = THREE.MathUtils.degToRad(lon + 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

/** Pink stays on screen-left, cyan on screen-right — lighting locked in world space */
function createDualToneLineMaterial(intensity = 1) {
  return new THREE.ShaderMaterial({
    uniforms: {
      pink: { value: PINK },
      cyan: { value: CYAN },
      intensity: { value: intensity },
    },
    vertexShader: /* glsl */ `
      varying float vSide;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vSide = smoothstep(-1.6, 1.6, world.x);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 pink;
      uniform vec3 cyan;
      uniform float intensity;
      varying float vSide;
      void main() {
        gl_FragColor = vec4(mix(pink, cyan, vSide) * intensity, 1.0);
      }
    `,
    depthTest: true,
    depthWrite: true,
  })
}

function createContinentLines(imageData, radius = 2.1) {
  const positions = []
  const latStep = 1.8
  const lonStep = 1.8

  for (let lat = -80; lat <= 80; lat += latStep) {
    for (let lon = -180; lon < 180; lon += lonStep) {
      const u = (lon + 180) / 360
      const v = (90 - lat) / 180
      if (sampleLand(imageData, u, v) < 0.45) continue

      const u2 = (lon + lonStep + 180) / 360
      if (sampleLand(imageData, u2, v) >= 0.45) {
        const a = latLonToVector3(lat, lon, radius)
        const b = latLonToVector3(lat, lon + lonStep, radius)
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }

      const v2 = (90 - (lat + latStep)) / 180
      if (sampleLand(imageData, u, v2) >= 0.45) {
        const a = latLonToVector3(lat, lon, radius)
        const b = latLonToVector3(lat + latStep, lon, radius)
        positions.push(a.x, a.y, a.z, b.x, b.y, b.z)
      }
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

  const mat = createDualToneLineMaterial(1)
  mat.polygonOffset = true
  mat.polygonOffsetFactor = -2
  mat.polygonOffsetUnits = -2

  const lines = new THREE.LineSegments(geo, mat)
  lines.renderOrder = 2
  return lines
}

function createBaseWireframe(radius = 2) {
  const geo = new THREE.IcosahedronGeometry(radius, 4)
  const wire = new THREE.WireframeGeometry(geo)
  const lines = new THREE.LineSegments(wire, createDualToneLineMaterial(0.7))
  lines.renderOrder = 1
  return lines
}

function createInnerCore() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.94, 48, 48),
    new THREE.MeshBasicMaterial({
      color: 0x04060f,
      transparent: false,
      depthWrite: true,
      depthTest: true,
    }),
  )
  mesh.renderOrder = 0
  return mesh
}

const MARKER_STYLES = {
  band: { color: 0xff2d8a, size: 0.055, shape: 'octa' },
  proposer: { color: 0x2de8ff, size: 0.042, shape: 'cone' },
  voter: { color: 0xffe566, size: 0.028, shape: 'sphere' },
}

function createMarkerMesh(kind) {
  const style = MARKER_STYLES[kind] || MARKER_STYLES.voter
  let geometry
  if (style.shape === 'octa') {
    geometry = new THREE.OctahedronGeometry(style.size, 0)
  } else if (style.shape === 'cone') {
    geometry = new THREE.ConeGeometry(style.size * 0.7, style.size * 1.6, 5)
  } else {
    geometry = new THREE.SphereGeometry(style.size, 10, 10)
  }
  const material = new THREE.MeshBasicMaterial({
    color: style.color,
    transparent: true,
    opacity: 0.95,
    depthTest: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = 3
  return mesh
}

function createBandBanner(marker) {
  const name = marker.artist_name
  if (!name) return null

  const url = pickSocialUrl(marker.artist_links)
  // Outer node is positioned by CSS2DRenderer (it overwrites transform each frame).
  // Scale the inner label so hover growth is not clobbered.
  const el = document.createElement(url ? 'a' : 'span')
  el.className = 'globe-banner'
  const inner = document.createElement('span')
  inner.className = 'globe-banner-inner'
  inner.textContent = name
  el.appendChild(inner)
  if (url) {
    el.href = url
    el.target = '_blank'
    el.rel = 'noopener noreferrer'
    el.title = `Open ${name}`
  }

  // Keep globe drag from stealing clicks on the banner
  el.addEventListener('pointerdown', (e) => e.stopPropagation())
  el.addEventListener('pointerup', (e) => e.stopPropagation())

  const label = new CSS2DObject(el)
  label.center.set(0.5, 1.15)
  return label
}

function createMarkersGroup(markers = []) {
  const group = new THREE.Group()
  const radius = 2.14
  const labeledArtists = new Set()
  const bandEntries = []

  for (const m of markers) {
    if (typeof m.lat !== 'number' || typeof m.lon !== 'number') continue
    const mesh = createMarkerMesh(m.kind)
    const pos = latLonToVector3(m.lat, m.lon, radius)
    mesh.position.copy(pos)
    mesh.lookAt(pos.clone().multiplyScalar(2))
    if (m.kind === 'proposer') {
      mesh.rotateX(Math.PI / 2)
    }
    mesh.userData.artistId = m.artist_id || null
    mesh.userData.kind = m.kind
    group.add(mesh)

    const glow = new THREE.Mesh(
      new THREE.SphereGeometry((MARKER_STYLES[m.kind]?.size || 0.03) * 1.8, 8, 8),
      new THREE.MeshBasicMaterial({
        color: MARKER_STYLES[m.kind]?.color || 0xffffff,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    )
    glow.position.copy(pos)
    glow.renderOrder = 2
    group.add(glow)

    let banner = null
    if (m.kind === 'band' && m.artist_name) {
      const key = m.artist_id || m.artist_name
      if (!labeledArtists.has(key)) {
        labeledArtists.add(key)
        banner = createBandBanner(m)
        if (banner) {
          banner.position.copy(latLonToVector3(m.lat, m.lon, radius + 0.08))
          banner.userData.artistId = m.artist_id || null
          group.add(banner)
        }
      }
    }

    if (m.kind === 'band' && m.artist_id) {
      bandEntries.push({
        artistId: m.artist_id,
        mesh,
        glow,
        banner,
        lat: m.lat,
        lon: m.lon,
      })
    }
  }

  return { group, bandEntries }
}

export function createGlobe(canvas, { markers = [], labelHost } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: false,
  })
  if (!renderer.getContext()) {
    renderer.dispose()
    throw new Error('WebGL unavailable')
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.autoClear = true

  const labelRenderer = new CSS2DRenderer()
  labelRenderer.domElement.className = 'globe-labels'
  // CSS2DRenderer defaults to overflow:hidden; allow banners past the globe box
  labelRenderer.domElement.style.overflow = 'visible'
  const host = labelHost || canvas.parentElement
  if (host) {
    host.style.position = 'relative'
    host.style.overflow = 'visible'
    host.appendChild(labelRenderer.domElement)
  }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 0.12, 6.4)

  const landMask = createLandMask()
  const group = new THREE.Group()
  group.add(createInnerCore())
  group.add(createBaseWireframe())
  group.add(createContinentLines(landMask))
  const { group: markersGroup, bandEntries } = createMarkersGroup(markers)
  group.add(markersGroup)
  group.rotation.z = THREE.MathUtils.degToRad(-14)
  group.rotation.y = THREE.MathUtils.degToRad(-55)

  scene.add(group)

  let highlightedId = null

  function setHighlight(artistId) {
    highlightedId = artistId || null
    for (const entry of bandEntries) {
      const on = highlightedId && entry.artistId === highlightedId
      if (entry.banner?.element) {
        entry.banner.element.classList.toggle('is-highlight', Boolean(on))
      }
    }
  }

  let width = 0
  let height = 0
  let dragging = false
  let lastX = 0
  let startX = 0
  let startY = 0
  let gestureAxis = null // null | 'x' | 'y' — lock after first clear move on touch
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const AXIS_LOCK_PX = 10

  function resize() {
    const rect = canvas.getBoundingClientRect()
    width = Math.max(1, Math.floor(rect.width))
    height = Math.max(1, Math.floor(rect.height))
    renderer.setSize(width, height, false)
    labelRenderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function onPointerDown(e) {
    if (e.target.closest?.('.globe-banner')) return
    dragging = true
    lastX = e.clientX
    startX = e.clientX
    startY = e.clientY
    gestureAxis = e.pointerType === 'touch' ? null : 'x'
    // Don't capture touch — pan-y needs the browser to own vertical scrolling
    if (e.pointerType !== 'touch') {
      canvas.setPointerCapture?.(e.pointerId)
    }
  }

  function onPointerMove(e) {
    if (!dragging) return

    if (e.pointerType === 'touch' && gestureAxis === null) {
      const totalDx = e.clientX - startX
      const totalDy = e.clientY - startY
      if (Math.abs(totalDx) < AXIS_LOCK_PX && Math.abs(totalDy) < AXIS_LOCK_PX) {
        return
      }
      gestureAxis = Math.abs(totalDx) >= Math.abs(totalDy) ? 'x' : 'y'
      lastX = e.clientX
      if (gestureAxis === 'y') return
    }

    if (gestureAxis === 'y') return

    const dx = e.clientX - lastX
    lastX = e.clientX
    group.rotation.y += dx * 0.005
  }

  function onPointerUp(e) {
    dragging = false
    gestureAxis = null
    if (e.pointerType !== 'touch') {
      canvas.releasePointerCapture?.(e.pointerId)
    }
  }

  canvas.addEventListener('pointerdown', onPointerDown)
  canvas.addEventListener('pointermove', onPointerMove)
  canvas.addEventListener('pointerup', onPointerUp)
  canvas.addEventListener('pointercancel', onPointerUp)
  canvas.addEventListener('pointerleave', () => {
    dragging = false
  })

  let last = performance.now()
  let raf = 0
  const camDir = new THREE.Vector3()
  const worldPos = new THREE.Vector3()

  function updateBannerVisibility() {
    camera.getWorldDirection(camDir)
    group.traverse((obj) => {
      if (!obj.isCSS2DObject) return
      obj.getWorldPosition(worldPos)
      // Hide banners on the far side of the globe
      const facing = worldPos.clone().normalize().dot(camDir)
      obj.element.style.opacity = facing < -0.15 ? '1' : '0'
      obj.element.style.pointerEvents = facing < -0.15 ? 'auto' : 'none'
    })
  }

  function tick(now) {
    raf = requestAnimationFrame(tick)
    const delta = Math.min((now - last) / 1000, 0.05)
    last = now

    if (!reducedMotion && !dragging) {
      group.rotation.y += SPIN_SPEED * delta
    }

    updateBannerVisibility()
    renderer.render(scene, camera)
    labelRenderer.render(scene, camera)
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas.parentElement ?? canvas)
  resize()
  tick(performance.now())

  return {
    setHighlight,
    destroy() {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      labelRenderer.domElement.remove()
      renderer.dispose()
    },
  }
}
