const BIOLOGY_SUBJECT = {
  id: 'biology',
  title: 'Biology',
  slug: 'biology',
  description: 'Cinematic visual learning for anatomy, cells, and living systems.',
  visualType: 'anatomy-3d'
}

const visualTypeMeta = {
  model3d: {
    label: '3D Anatomy Focus',
    summary: 'Immersive model-first learning',
    accent: 'from-white/12 to-white/4'
  },
  imageGallery: {
    label: 'Image Gallery Focus',
    summary: 'Visual reference and labeled studies',
    accent: 'from-white/12 to-white/4'
  },
  simulation: {
    label: 'Simulation Focus',
    summary: 'Motion and process visualization',
    accent: 'from-white/10 to-white/3'
  },
  videoLesson: {
    label: 'Video Lesson Focus',
    summary: 'Narrated visual teaching',
    accent: 'from-white/10 to-white/3'
  },
  mixed: {
    label: 'Mixed Media Focus',
    summary: 'Adaptive blend of media types',
    accent: 'from-white/10 to-white/3'
  },
  'anatomy-3d': {
    label: 'Anatomy 3D',
    summary: 'Immersive organ and body visualization',
    accent: 'from-white/12 to-white/4'
  },
  simulation: {
    label: 'Simulation',
    summary: 'Motion-driven visual explanation',
    accent: 'from-white/10 to-white/3'
  },
  'image-gallery': {
    label: 'Image Gallery',
    summary: 'Labeled visual reference set',
    accent: 'from-white/10 to-white/3'
  },
  graph: {
    label: 'Graph',
    summary: 'Relationships, trends, and curves',
    accent: 'from-white/10 to-white/3'
  },
  'code-visualizer': {
    label: 'Code Visualizer',
    summary: 'Logic, algorithms, and step flow',
    accent: 'from-white/10 to-white/3'
  },
  'interactive-diagram': {
    label: 'Interactive Diagram',
    summary: 'Annotated flow and structural map',
    accent: 'from-white/10 to-white/3'
  }
}

function slugify(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function titleCase(value = '') {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildSvgDataUri({ title, subtitle, accent = '#f5f5f5', motif = 'orb' }) {
  const motifs = {
    orb: '<circle cx="900" cy="180" r="190" fill="currentColor" fill-opacity="0.12"/><circle cx="260" cy="540" r="128" fill="currentColor" fill-opacity="0.1"/>',
    organ: '<path d="M820 150c-85 0-150 72-150 160 0 120 150 218 150 218s150-98 150-218c0-88-65-160-150-160Z" fill="currentColor" fill-opacity="0.12"/><path d="M820 200c-38 0-69 31-69 69 0 51 69 92 69 92s69-41 69-92c0-38-31-69-69-69Z" fill="currentColor" fill-opacity="0.2"/>',
    network: '<rect x="760" y="120" width="260" height="260" rx="40" fill="currentColor" fill-opacity="0.09"/><path d="M790 180h200M790 240h150M790 300h180" stroke="currentColor" stroke-opacity="0.45" stroke-width="6" stroke-linecap="round"/>',
    diagram: '<circle cx="870" cy="180" r="88" fill="currentColor" fill-opacity="0.12"/><circle cx="1010" cy="300" r="58" fill="currentColor" fill-opacity="0.1"/><circle cx="760" cy="330" r="68" fill="currentColor" fill-opacity="0.08"/>',
    dna: '<path d="M790 140c130 78 210 210 210 360M1000 140c-130 78-210 210-210 360" stroke="currentColor" stroke-width="7" stroke-linecap="round" stroke-opacity="0.45"/><path d="M812 200h168M786 280h220M812 360h168M786 440h220" stroke="currentColor" stroke-width="4" stroke-opacity="0.35"/>'
  }

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" fill="none">
      <rect width="1200" height="720" rx="48" fill="#050505" />
      <g color="${accent}">
        <circle cx="900" cy="120" r="220" fill="currentColor" fill-opacity="0.06" />
        <circle cx="160" cy="620" r="210" fill="currentColor" fill-opacity="0.04" />
        ${motifs[motif] || motifs.orb}
      </g>
      <g opacity="0.8">
        <text x="72" y="116" fill="#ffffff" font-size="22" font-family="Arial, Helvetica, sans-serif" letter-spacing="5">BIOLOGY VISUAL NOTE</text>
        <text x="72" y="232" fill="#ffffff" font-size="80" font-family="Arial, Helvetica, sans-serif" font-weight="700">${title}</text>
        <text x="72" y="292" fill="#d6d6d6" font-size="28" font-family="Arial, Helvetica, sans-serif">${subtitle}</text>
      </g>
      <rect x="70" y="388" width="460" height="248" rx="28" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" />
      <rect x="100" y="420" width="172" height="172" rx="24" fill="rgba(255,255,255,0.06)" />
      <path d="M150 506h72M186 470v72" stroke="#fff" stroke-opacity="0.6" stroke-width="6" stroke-linecap="round" />
      <text x="304" y="470" fill="#ffffff" font-size="24" font-family="Arial, Helvetica, sans-serif">Simple visual learning</text>
      <text x="304" y="510" fill="#d0d0d0" font-size="21" font-family="Arial, Helvetica, sans-serif">Labeled anatomy</text>
      <text x="304" y="548" fill="#d0d0d0" font-size="21" font-family="Arial, Helvetica, sans-serif">AI-guided explanation</text>
      <text x="304" y="586" fill="#d0d0d0" font-size="21" font-family="Arial, Helvetica, sans-serif">Quiz-ready summary</text>
    </svg>
  `)}`
}

function baseQuiz(title, answer, explanation) {
  return [
    {
      question: `What is the main role of the ${title.toLowerCase()}?`,
      options: [answer, 'Generating light', 'Creating sound', 'Storing rocks'],
      answer,
      explanation
    },
    {
      question: `Which idea best helps you understand the ${title.toLowerCase()} visually?`,
      options: ['System flow', 'Random motion', 'Color mixing', 'Weather patterns'],
      answer: 'System flow',
      explanation: 'Visual systems work best when students can see how parts connect and move.'
    }
  ]
}

function createTopicImage({ title, subtitle, motif }) {
  return buildSvgDataUri({
    title,
    subtitle,
    accent: '#f5f5f5',
    motif
  })
}

function createEyeSvgDataUri({ title, subtitle }) {
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'>
    <rect width='1200' height='720' rx='48' fill='#050505'/>
    <g transform='translate(120,80)'>
      <g transform='translate(240,160)'>
        <ellipse cx='300' cy='200' rx='360' ry='160' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.06)'/>
        <ellipse cx='300' cy='200' rx='260' ry='100' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.08)'/>
        <circle cx='300' cy='200' r='60' fill='rgba(255,255,255,0.12)' />
        <circle cx='300' cy='200' r='28' fill='#050505' />
        <path d='M80 200 C180 120, 420 120, 520 200' stroke='rgba(255,255,255,0.06)' stroke-width='6' fill='none' />
      </g>
      <g transform='translate(20,420)'>
        <text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>${title}</text>
        <text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>${subtitle}</text>
      </g>
    </g>
  </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function createSkeletonSvgDataUri({ title, subtitle }) {
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'>
    <rect width='1200' height='720' rx='48' fill='#050505'/>
    <g transform='translate(120,60)'>
      <g transform='translate(220,80) scale(0.9)'>
        <rect x='260' y='40' width='160' height='200' rx='80' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.06)' />
        <rect x='230' y='240' width='220' height='320' rx='26' fill='rgba(255,255,255,0.02)' stroke='rgba(255,255,255,0.05)' />
        <path d='M340 260 v120 M420 260 v120' stroke='rgba(255,255,255,0.08)' stroke-width='12' stroke-linecap='round' />
        <circle cx='350' cy='100' r='48' fill='rgba(255,255,255,0.12)' />
      </g>
      <g transform='translate(20,440)'>
        <text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>${title}</text>
        <text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>${subtitle}</text>
      </g>
    </g>
  </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function createLungsSvgDataUri({ title, subtitle }) {
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'>
    <rect width='1200' height='720' rx='48' fill='#050505'/>
    <g transform='translate(160,80)'>
      <g transform='translate(200,80)'>
        <path d='M220 120 C180 60, 120 60, 120 220 C120 360, 220 420, 300 420' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.06)'/>
        <path d='M420 120 C460 60, 520 60, 520 220 C520 360, 420 420, 340 420' fill='rgba(255,255,255,0.03)' stroke='rgba(255,255,255,0.06)'/>
        <rect x='300' y='40' width='40' height='220' rx='10' fill='rgba(255,255,255,0.04)' />
      </g>
      <g transform='translate(20,420)'>
        <text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>${title}</text>
        <text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>${subtitle}</text>
      </g>
    </g>
  </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function createDnaSvgDataUri({ title, subtitle }) {
  const svg = `
  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 720'>
    <rect width='1200' height='720' rx='48' fill='#050505'/>
    <g transform='translate(240,60)'>
      <g transform='translate(200,60)'>
        <path d='M80 60 C140 160, 220 260, 280 360 C340 460, 420 560, 480 660' stroke='rgba(255,255,255,0.06)' stroke-width='14' fill='none' />
        <path d='M140 60 C200 160, 280 260, 340 360 C400 460, 480 560, 540 660' stroke='rgba(255,255,255,0.06)' stroke-width='14' fill='none' />
        <g stroke='rgba(255,255,255,0.05)' stroke-width='8'>
          <path d='M110 120 L170 200' />
          <path d='M170 200 L230 280' />
          <path d='M230 280 L290 360' />
        </g>
      </g>
      <g transform='translate(20,420)'>
        <text x='0' y='0' fill='#ffffff' font-size='22' font-family='Arial'>${title}</text>
        <text x='0' y='36' fill='#d6d6d6' font-size='18' font-family='Arial'>${subtitle}</text>
      </g>
    </g>
  </svg>`

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function introBlock({ title, textBody }) {
  return {
    type: 'text',
    heading: `Understand ${title} in plain language`,
    body: textBody
  }
}

function anatomyLabelsBlock({ title, image, labels = [] }) {
  return {
    type: 'anatomy-labels',
    title: `${title} labeled anatomy`,
    image,
    labels
  }
}

function interactiveHotspotsBlock({ title, image, hotspots = [] }) {
  return {
    type: 'interactive-hotspots',
    title: `${title} interactive anatomy points`,
    image,
    hotspots
  }
}

function animatedDiagramBlock({ title, subtitle, steps = [], note = '' }) {
  return {
    type: 'animated-diagram',
    title,
    subtitle,
    steps,
    note
  }
}

function medicalImageGalleryBlock({ title, images = [] }) {
  return {
    type: 'medical-image-gallery',
    title,
    images
  }
}

function embeddedVideoBlock({ title, src, caption }) {
  return {
    type: 'embedded-video',
    title,
    src,
    caption
  }
}

function anatomyFactsBlock({ title, facts = [] }) {
  return {
    type: 'anatomy-facts',
    title,
    facts
  }
}

function threeDModelBlock(title, src) {
  return {
    type: '3d-model',
    title: `${title} 3D model`,
    src,
    caption: 'Rotate, zoom, and inspect the structure from every angle.'
  }
}

function quizBlock(questions) {
  return {
    type: 'quiz',
    title: 'Quick check',
    questions
  }
}

function createBiologyTopic({
  title,
  slug,
  summary,
  visualType,
  model3d = null,
  contentBlocks = [],
  imageLabel,
  imageCaption,
  diagramTitle,
  diagramItems,
  textBody,
  chatbotPrompt,
  quiz,
  model3dSuggestions = []
}) {
  const image = createTopicImage({
    title: imageLabel || title,
    subtitle: imageCaption || summary,
    motif: visualType === 'interactive-diagram' ? 'diagram' : visualType === 'graph' ? 'network' : visualType === 'simulation' ? 'orb' : visualType === 'anatomy-3d' ? 'organ' : visualType === 'code-visualizer' ? 'network' : 'diagram'
  })

  const finalQuiz = quiz || baseQuiz(title, titleCase(title), `Focus on the main function first. The visuals help connect structure and meaning.`)
  const fallbackBlocks = [
    introBlock({ title, textBody }),
    {
      type: 'image',
      title: `${title} anatomy snapshot`,
      src: image,
      caption: imageCaption || summary
    },
    model3d ? threeDModelBlock(title, model3d) : null,
    {
      type: 'diagram',
      title: diagramTitle,
      items: diagramItems
    },
    quizBlock(finalQuiz)
  ].filter(Boolean)
  const resolvedBlocks = contentBlocks.length ? [...contentBlocks, quizBlock(finalQuiz)] : fallbackBlocks

  return {
    title,
    slug,
    subject: BIOLOGY_SUBJECT.slug,
    subjectTitle: BIOLOGY_SUBJECT.title,
    difficulty: 'beginner',
    visualType,
    summary,
    contentBlocks: resolvedBlocks,
    images: [
      {
        src: image,
        alt: `${title} visual study card`,
        caption: imageCaption || summary
      }
    ],
    videos: [],
    model3d,
    model3dSuggestions,
    quiz: finalQuiz,
    chatbotPrompt,
    recommendedVisualType: visualType,
    aiPrompt: chatbotPrompt
  }
}

const BIOLOGY_SEED_TOPICS = [
  createBiologyTopic({
    title: 'Heart',
    slug: 'heart',
    summary: 'A muscular pump that pushes blood through the body and keeps every organ supplied with oxygen.',
    visualType: 'anatomy-3d',
    model3d: '/models/heart.glb',
    model3dSuggestions: ['heart.glb', 'heart-anatomy.glb', 'cardiac-system.glb'],
    contentBlocks: [
      introBlock({
        title: 'Heart',
        textBody: 'The heart works like a pressure engine. Each beat pulls blood in, pushes it out, and repeats thousands of times a day. The important visual idea is flow: where blood enters, where it gets oxygen, and where it leaves the heart.'
      }),
      threeDModelBlock('Heart', '/models/heart.glb'),
      animatedDiagramBlock({
        title: 'Blood flow animation',
        subtitle: 'Follow the pulse through the chambers and out to the body.',
        steps: [
          'Right atrium receives oxygen-poor blood from the body.',
          'Right ventricle pushes blood to the lungs for oxygen.',
          'Left atrium receives oxygen-rich blood from the lungs.',
          'Left ventricle pumps the fresh blood to the body.'
        ],
        note: 'The one-way valve system keeps the circuit moving forward.'
      }),
      anatomyLabelsBlock({
        title: 'Heart',
        image: createTopicImage({
          title: 'Heart chambers',
          subtitle: 'Labeled chambers, valves, and circulation flow.',
          motif: 'organ'
        }),
        labels: [
          { name: 'Right atrium', value: 'Receives blood from the body' },
          { name: 'Right ventricle', value: 'Sends blood to the lungs' },
          { name: 'Left atrium', value: 'Receives oxygen-rich blood' },
          { name: 'Left ventricle', value: 'Pumps blood through the body' },
          { name: 'Valves', value: 'Prevent backward flow' }
        ]
      }),
      interactiveHotspotsBlock({
        title: 'Heart',
        image: createTopicImage({
          title: 'Heartbeat path',
          subtitle: 'Tap the anatomy points to trace circulation.',
          motif: 'organ'
        }),
        hotspots: [
          { x: 24, y: 28, label: 'Right atrium', detail: 'Blood enters here from the body before moving to the right ventricle.' },
          { x: 38, y: 50, label: 'Right ventricle', detail: 'This chamber sends blood toward the lungs.' },
          { x: 67, y: 31, label: 'Left atrium', detail: 'Fresh blood from the lungs returns here.' },
          { x: 74, y: 55, label: 'Left ventricle', detail: 'The strongest chamber pushes blood to the body.' },
          { x: 56, y: 68, label: 'Valves', detail: 'These one-way gates stop blood from flowing backward.' }
        ]
      }),
      medicalImageGalleryBlock({
        title: 'Heart medical gallery',
        images: [
          { src: createTopicImage({ title: 'Heart cross-section', subtitle: 'Chamber depth and wall thickness.', motif: 'organ' }), caption: 'Cross-section anatomy' },
          { src: createTopicImage({ title: 'Cardiac flow chart', subtitle: 'Route of blood through the heart and lungs.', motif: 'diagram' }), caption: 'Flow route diagram' },
          { src: createTopicImage({ title: 'Pulse study', subtitle: 'The beat rhythm that drives circulation.', motif: 'orb' }), caption: 'Pulse rhythm visual' }
        ]
      }),
      embeddedVideoBlock({
        title: 'Heart cycle video slot',
        src: null,
        caption: 'Add a short circulation or heartbeat clip here when you connect a media source.'
      }),
      anatomyFactsBlock({
        title: 'Heart facts',
        facts: [
          'The right side sends blood to the lungs.',
          'The left ventricle has the thickest muscle wall.',
          'Valves keep the flow moving in one direction.',
          'The pulse you feel is the heart contracting.'
        ]
      })
    ],
    imageLabel: 'Heart',
    imageCaption: 'Chambers, valves, and circulation flow.',
    diagramTitle: 'Blood flow map',
    diagramItems: [
      'Blood enters the right side',
      'The lungs add oxygen',
      'The left side pumps oxygen-rich blood out',
      'Valves keep flow moving in one direction'
    ],
    textBody: 'The heart works like a pressure engine. Each beat pulls blood in, pushes it out, and repeats thousands of times a day. The important visual idea is flow: where blood enters, where it gets oxygen, and where it leaves the heart.',
    chatbotPrompt: 'You are a concise biology tutor. Explain the heart with simple visual metaphors, labeled parts, and circulation order. Keep answers beginner-friendly.',
    quiz: [
      {
        question: 'Which side of the heart sends blood to the lungs?',
        options: ['Right side', 'Left side', 'Top chamber only', 'Both sides at once'],
        answer: 'Right side',
        explanation: 'The right side sends blood to the lungs so it can pick up oxygen.'
      },
      {
        question: 'What do valves mainly do?',
        options: ['Keep blood flowing one way', 'Create oxygen', 'Filter food', 'Store energy'],
        answer: 'Keep blood flowing one way',
        explanation: 'Valves prevent blood from moving backward.'
      }
    ]
  }),
  createBiologyTopic({
    title: 'Brain',
    slug: 'brain',
    summary: 'The control center that processes signals, stores memory, and coordinates thought and movement.',
    visualType: 'interactive-diagram',
    contentBlocks: [
      introBlock({
        title: 'Brain',
        textBody: 'The brain is a signal-processing system. It reads inputs from the senses, turns them into decisions, and sends commands back out. A visual diagram works well because students can see how regions cooperate instead of memorizing isolated labels.'
      }),
      animatedDiagramBlock({
        title: 'Neural activity animation',
        subtitle: 'Signals move from input to thought to action.',
        steps: [
          'Sensors pick up sight, sound, touch, and motion.',
          'Networks process the signal and compare patterns.',
          'The brain chooses a response or stores the memory.',
          'Commands travel back out through the nervous system.'
        ],
        note: 'Neurons fire in patterns, which is why the brain feels like a living network.'
      }),
      anatomyLabelsBlock({
        title: 'Brain',
        image: createTopicImage({
          title: 'Brain regions',
          subtitle: 'Cerebrum, cerebellum, and brainstem in one study card.',
          motif: 'network'
        }),
        labels: [
          { name: 'Cerebrum', value: 'Thinking, language, and memory' },
          { name: 'Cerebellum', value: 'Balance and coordination' },
          { name: 'Brainstem', value: 'Breathing and automatic control' },
          { name: 'Neural pathways', value: 'Carry messages between regions' }
        ]
      }),
      interactiveHotspotsBlock({
        title: 'Brain',
        image: createTopicImage({
          title: 'Brain map',
          subtitle: 'Tap each region to see what it controls.',
          motif: 'network'
        }),
        hotspots: [
          { x: 26, y: 30, label: 'Frontal lobe', detail: 'Planning, decision-making, and speech production.' },
          { x: 54, y: 18, label: 'Parietal lobe', detail: 'Processes touch and spatial awareness.' },
          { x: 74, y: 36, label: 'Temporal lobe', detail: 'Hearing, language, and memory.' },
          { x: 48, y: 62, label: 'Cerebellum', detail: 'Keeps motion smooth and coordinated.' },
          { x: 72, y: 78, label: 'Brainstem', detail: 'Keeps breathing and heartbeat moving.' }
        ]
      }),
      medicalImageGalleryBlock({
        title: 'Brain study gallery',
        images: [
          { src: createTopicImage({ title: 'Brain tissue', subtitle: 'Soft tissue and folded cortex texture.', motif: 'network' }), caption: 'Tissue view' },
          { src: createTopicImage({ title: 'Signal pathway', subtitle: 'How messages travel across neurons.', motif: 'diagram' }), caption: 'Pathway map' },
          { src: createTopicImage({ title: 'Memory network', subtitle: 'Connections that support learning.', motif: 'orb' }), caption: 'Learning network' }
        ]
      }),
      anatomyFactsBlock({
        title: 'Brain facts',
        facts: [
          'The cerebellum refines balance and timing.',
          'The brainstem handles automatic life functions.',
          'Neurons communicate with electrical and chemical signals.',
          'Different regions cooperate instead of working alone.'
        ]
      })
    ],
    imageLabel: 'Brain networks',
    imageCaption: 'Thinking, memory, and signal pathways.',
    diagramTitle: 'Brain function map',
    diagramItems: [
      'Cerebrum: thinking and decisions',
      'Cerebellum: balance and coordination',
      'Brainstem: automatic life support',
      'Neurons: signal-carrying cells'
    ],
    textBody: 'The brain is a signal-processing system. It reads inputs from the senses, turns them into decisions, and sends commands back out. A visual diagram works well because students can see how regions cooperate instead of memorizing isolated labels.',
    chatbotPrompt: 'You are a patient biology tutor. Explain the brain using signal flow, simple region labels, and memory-friendly analogies.',
    quiz: [
      {
        question: 'Which part helps with balance and coordination?',
        options: ['Cerebellum', 'Retina', 'Stomach', 'Rib cage'],
        answer: 'Cerebellum',
        explanation: 'The cerebellum helps fine-tune movement and balance.'
      },
      {
        question: 'What do neurons do?',
        options: ['Carry signals', 'Digest food', 'Pump blood', 'Build bone'],
        answer: 'Carry signals',
        explanation: 'Neurons pass electrical and chemical signals through the nervous system.'
      }
    ]
  }),
  createBiologyTopic({
    title: 'Eye',
    slug: 'eye',
    summary: 'A light-focusing organ that turns visual scenes into signals the brain can understand.',
    visualType: 'image-gallery',
    contentBlocks: [
      introBlock({
        title: 'Eye',
        textBody: 'The eye is easier to learn when students follow the path of light. A gallery of labels, a focus on the lens, and a clear signal path make the topic feel mechanical instead of abstract.'
      }),
      anatomyLabelsBlock({
        title: 'Eye',
        image: createEyeSvgDataUri({
          title: 'Eye layers',
          subtitle: 'Cornea, lens, retina, and optic nerve.'
        }),
        labels: [
          { name: 'Cornea', value: 'Protective front window' },
          { name: 'Lens', value: 'Focuses light onto the retina' },
          { name: 'Retina', value: 'Detects light and forms signals' },
          { name: 'Optic nerve', value: 'Sends the image to the brain' }
        ]
      }),
      interactiveHotspotsBlock({
        title: 'Eye',
        image: createEyeSvgDataUri({
          title: 'Vision path',
          subtitle: 'Tap the regions that turn light into sight.'
        }),
        hotspots: [
          { x: 19, y: 38, label: 'Cornea', detail: 'The cornea bends and protects incoming light.' },
          { x: 43, y: 42, label: 'Lens', detail: 'The lens sharpens the image.' },
          { x: 66, y: 48, label: 'Retina', detail: 'Light-sensitive layer that starts the signal.' },
          { x: 82, y: 58, label: 'Optic nerve', detail: 'Carries the visual message to the brain.' }
        ]
      }),
      medicalImageGalleryBlock({
        title: 'Eye study gallery',
        images: [
          { src: createTopicImage({ title: 'Eye cross-section', subtitle: 'A cutaway view of the eye structure.', motif: 'diagram' }), caption: 'Cross-section' },
          { src: createTopicImage({ title: 'Lens focus', subtitle: 'How the eye sharpens incoming light.', motif: 'orb' }), caption: 'Focus study' },
          { src: createTopicImage({ title: 'Retina map', subtitle: 'The back layer that senses light.', motif: 'network' }), caption: 'Retina layer' }
        ]
      }),
      embeddedVideoBlock({
        title: 'Vision lesson video slot',
        src: null,
        caption: 'Use this slot for an eye anatomy clip or light-path animation.'
      }),
      anatomyFactsBlock({
        title: 'Eye facts',
        facts: [
          'The lens focuses light onto the retina.',
          'The optic nerve carries the signal to the brain.',
          'The cornea is the transparent protective front layer.',
          'Seeing is a partnership between eye and brain.'
        ]
      })
    ],
    imageLabel: 'Eye layers',
    imageCaption: 'Cornea, lens, retina, and optic nerve.',
    diagramTitle: 'How vision works',
    diagramItems: [
      'Light enters through the cornea',
      'The lens focuses the image',
      'The retina detects light',
      'The optic nerve sends the message to the brain'
    ],
    textBody: 'The eye is easier to learn when students follow the path of light. A gallery of labels, a focus on the lens, and a clear signal path make the topic feel mechanical instead of abstract.',
    chatbotPrompt: 'You are an educational tutor for visual learners. Explain the eye using a light path, layer labels, and simple analogies.',
    quiz: [
      {
        question: 'Which part focuses light?',
        options: ['Lens', 'Rib', 'Kidney', 'Femur'],
        answer: 'Lens',
        explanation: 'The lens bends light so it lands clearly on the retina.'
      },
      {
        question: 'What sends signals from the eye to the brain?',
        options: ['Optic nerve', 'Tendon', 'Valve', 'Cartilage'],
        answer: 'Optic nerve',
        explanation: 'The optic nerve carries the visual signal to the brain.'
      }
    ]
  }),
  createBiologyTopic({
    title: 'Skeleton',
    slug: 'skeleton',
    summary: 'The body’s structural frame that supports movement, protects organs, and stores minerals.',
    visualType: 'anatomy-3d',
    contentBlocks: [
      introBlock({
        title: 'Skeleton',
        textBody: 'The skeleton acts like an internal scaffold. It keeps the body upright, shields delicate organs, and gives muscles hard points to pull against. A structural visual layout helps students see that bones are a system, not separate pieces.'
      }),
      anatomyLabelsBlock({
        title: 'Skeleton',
        image: createSkeletonSvgDataUri({
          title: 'Skeleton frame',
          subtitle: 'Support, protection, and movement together.'
        }),
        labels: [
          { name: 'Skull', value: 'Protects the brain' },
          { name: 'Rib cage', value: 'Protects the heart and lungs' },
          { name: 'Spine', value: 'Supports posture and balance' },
          { name: 'Long bones', value: 'Give muscles leverage for motion' }
        ]
      }),
      animatedDiagramBlock({
        title: 'Bone and muscle motion',
        subtitle: 'See how bones and muscles cooperate to create movement.',
        steps: [
          'Muscles contract and shorten.',
          'Tendons pull on the bones.',
          'Joints move like controlled hinges.',
          'The body changes position or direction.'
        ],
        note: 'The frame is static, but the joints and muscles make it dynamic.'
      }),
      medicalImageGalleryBlock({
        title: 'Skeleton gallery',
        images: [
          { src: createTopicImage({ title: 'Skull study', subtitle: 'Protective bone structure around the brain.', motif: 'organ' }), caption: 'Skull study' },
          { src: createTopicImage({ title: 'Rib cage', subtitle: 'Protects the chest organs.', motif: 'diagram' }), caption: 'Chest protection' },
          { src: createTopicImage({ title: 'Spine alignment', subtitle: 'Posture and balance line.', motif: 'orb' }), caption: 'Spinal alignment' }
        ]
      }),
      anatomyFactsBlock({
        title: 'Skeleton facts',
        facts: [
          'Bones support posture and protect organs.',
          'Joints let the frame move without falling apart.',
          'Bone tissue stores minerals like calcium.',
          'Muscles need bones as anchors to create movement.'
        ]
      })
    ],
    imageLabel: 'Skeleton frame',
    imageCaption: 'Support, protection, and movement together.',
    diagramTitle: 'Skeleton roles',
    diagramItems: [
      'Skull protects the brain',
      'Ribs protect the heart and lungs',
      'Spine supports posture',
      'Bones team up with muscles for motion'
    ],
    textBody: 'The skeleton acts like an internal scaffold. It keeps the body upright, shields delicate organs, and gives muscles hard points to pull against. A structural visual layout helps students see that bones are a system, not separate pieces.',
    chatbotPrompt: 'You are a visual biology tutor. Explain the skeleton using structure, protection, and movement with clear analogies.',
    quiz: [
      {
        question: 'Which bone area protects the brain?',
        options: ['Skull', 'Femur', 'Tibia', 'Humerus'],
        answer: 'Skull',
        explanation: 'The skull surrounds and protects the brain.'
      },
      {
        question: 'Why do bones matter for movement?',
        options: ['They give muscles something to pull on', 'They create light', 'They replace nerves', 'They stop breathing'],
        answer: 'They give muscles something to pull on',
        explanation: 'Muscles pull on bones to create movement.'
      }
    ]
  }),
  createBiologyTopic({
    title: 'Lungs',
    slug: 'lungs',
    summary: 'Breathing organs that exchange oxygen and carbon dioxide so the body can keep producing energy.',
    visualType: 'simulation',
    contentBlocks: [
      introBlock({
        title: 'Lungs',
        textBody: 'The lung system is best understood as a cycle. Students should see the expansion, the exchange of gases, and the return of air out of the body. That makes a simulation-style layout a strong fit.'
      }),
      animatedDiagramBlock({
        title: 'Breathing animation',
        subtitle: 'Track inhale and exhale as a living cycle.',
        steps: [
          'Air enters through the trachea.',
          'The lungs expand and the air sacs fill.',
          'Oxygen moves into the blood while carbon dioxide leaves.',
          'The body exhales the used air.'
        ],
        note: 'Breathing is a repeatable visual rhythm.'
      }),
      anatomyLabelsBlock({
        title: 'Lungs',
        image: createLungsSvgDataUri({
          title: 'Lung exchange',
          subtitle: 'Inhale, exchange gases, exhale.'
        }),
        labels: [
          { name: 'Trachea', value: 'Airway that carries air into the chest' },
          { name: 'Bronchi', value: 'Branching air tubes' },
          { name: 'Alveoli', value: 'Tiny exchange sacs' },
          { name: 'Diaphragm', value: 'Muscle that drives the breath cycle' }
        ]
      }),
      interactiveHotspotsBlock({
        title: 'Lungs',
        image: createTopicImage({
          title: 'Breathing path',
          subtitle: 'Tap the parts that move air and exchange gases.',
          motif: 'orb'
        }),
        hotspots: [
          { x: 21, y: 24, label: 'Trachea', detail: 'The main air tube down the neck.' },
          { x: 43, y: 36, label: 'Bronchi', detail: 'Branching airways that lead into each lung.' },
          { x: 60, y: 58, label: 'Alveoli', detail: 'Microscopic sacs where oxygen and carbon dioxide swap.' },
          { x: 38, y: 78, label: 'Diaphragm', detail: 'This muscle changes chest volume for breathing.' }
        ]
      }),
      embeddedVideoBlock({
        title: 'Breathing clip slot',
        src: null,
        caption: 'Use this slot for a short inhalation / exhalation animation.'
      }),
      anatomyFactsBlock({
        title: 'Lung facts',
        facts: [
          'Oxygen enters the blood in the alveoli.',
          'Carbon dioxide leaves the body during exhale.',
          'The diaphragm changes chest pressure.',
          'Breathing keeps energy production going.'
        ]
      })
    ],
    imageLabel: 'Lung exchange',
    imageCaption: 'Inhale, exchange gases, exhale.',
    diagramTitle: 'Breathing cycle',
    diagramItems: [
      'Air moves in through the trachea',
      'The lungs expand on inhale',
      'Oxygen moves into the blood',
      'Carbon dioxide leaves on exhale'
    ],
    textBody: 'The lung system is best understood as a cycle. Students should see the expansion, the exchange of gases, and the return of air out of the body. That makes a simulation-style layout a strong fit.',
    chatbotPrompt: 'You are a biology tutor who explains breathing with step-by-step airflow and gas exchange.',
    quiz: [
      {
        question: 'What gas do lungs bring into the blood?',
        options: ['Oxygen', 'Nitrogen', 'Helium', 'Smoke'],
        answer: 'Oxygen',
        explanation: 'Oxygen moves from the lungs into the bloodstream.'
      },
      {
        question: 'What gas do lungs remove from the body?',
        options: ['Carbon dioxide', 'Gold', 'Waterproofing', 'Calcium'],
        answer: 'Carbon dioxide',
        explanation: 'Carbon dioxide is carried out during exhalation.'
      }
    ]
  }),
  createBiologyTopic({
    title: 'DNA',
    slug: 'dna',
    summary: 'The instruction molecule that stores biological code and guides how living things are built.',
    visualType: 'graph',
    contentBlocks: [
      introBlock({
        title: 'DNA',
        textBody: 'DNA works like a compact instruction library. A graph or code-style visual helps students connect the idea of stored information with the shape of the double helix and the pairing rules.'
      }),
      animatedDiagramBlock({
        title: 'Double helix animation',
        subtitle: 'Follow the twisting ladder of genetic information.',
        steps: [
          'The backbone forms two twisting strands.',
          'The rungs pair A with T and C with G.',
          'Genes sit inside the long code sequence.',
          'Cells read DNA to build proteins and traits.'
        ],
        note: 'The pattern is simple, but the information is enormous.'
      }),
      anatomyLabelsBlock({
        title: 'DNA',
        image: createDnaSvgDataUri({
          title: 'DNA double helix',
          subtitle: 'Base pairing and genetic code.'
        }),
        labels: [
          { name: 'Sugar-phosphate backbone', value: 'The outer support rails' },
          { name: 'Base pairs', value: 'The coded rungs' },
          { name: 'Genes', value: 'Instruction segments' },
          { name: 'Chromosome', value: 'A packed DNA structure' }
        ]
      }),
      medicalImageGalleryBlock({
        title: 'DNA molecular gallery',
        images: [
          { src: createTopicImage({ title: 'DNA strand', subtitle: 'Twisting ladder in close-up.', motif: 'dna' }), caption: 'Helix close-up' },
          { src: createTopicImage({ title: 'Base pairing', subtitle: 'A-T and C-G relationships.', motif: 'diagram' }), caption: 'Pairing rules' },
          { src: createTopicImage({ title: 'Genetic code', subtitle: 'The message cells read and copy.', motif: 'network' }), caption: 'Information flow' }
        ]
      }),
      anatomyFactsBlock({
        title: 'DNA facts',
        facts: [
          'DNA stores the instructions for life.',
          'A pairs with T and C pairs with G.',
          'Genes are sections of DNA with specific jobs.',
          'The double helix keeps information compact and readable.'
        ]
      })
    ],
    imageLabel: 'DNA double helix',
    imageCaption: 'Base pairing and genetic code.',
    diagramTitle: 'DNA code map',
    diagramItems: [
      'A pairs with T',
      'C pairs with G',
      'Genes are code sections',
      'DNA instructions guide cell behavior'
    ],
    textBody: 'DNA works like a compact instruction library. A graph or code-style visual helps students connect the idea of stored information with the shape of the double helix and the pairing rules.',
    chatbotPrompt: 'You are a friendly genetics tutor. Explain DNA with code, instructions, and pairing rules in simple language.',
    quiz: [
      {
        question: 'What shape is DNA usually shown as?',
        options: ['Double helix', 'Square grid', 'Flat circle', 'Triangle spiral'],
        answer: 'Double helix',
        explanation: 'DNA is commonly illustrated as a twisting ladder or double helix.'
      },
      {
        question: 'Which base pairs with adenine?',
        options: ['Thymine', 'Guanine', 'Cytosine', 'Ribose'],
        answer: 'Thymine',
        explanation: 'Adenine pairs with thymine in DNA.'
      }
    ]
  })
]

const seedTopicMap = new Map(BIOLOGY_SEED_TOPICS.map(topic => [topic.slug, topic]))

function getSeedTopicsForSubject(subjectSlugOrId = '') {
  if (subjectSlugOrId !== BIOLOGY_SUBJECT.slug && subjectSlugOrId !== BIOLOGY_SUBJECT.id) {
    return []
  }

  return BIOLOGY_SEED_TOPICS.map(topic => normalizeTopicRecord(topic))
}

function getSeedTopicBySlug(slug = '') {
  const match = seedTopicMap.get(slug)
  return match ? { ...match } : null
}

function normalizeTopicRecord(topic = {}) {
  const title = topic.title || ''
  const slug = topic.slug || slugify(title)
  const summary = topic.summary || topic.description || ''
  const contentBlocks = Array.isArray(topic.contentBlocks) ? topic.contentBlocks : []
  const images = Array.isArray(topic.images) ? topic.images : []
  const videos = Array.isArray(topic.videos) ? topic.videos : []
  const quiz = Array.isArray(topic.quiz) ? topic.quiz : []
  const model3dSuggestions = Array.isArray(topic.model3dSuggestions) ? topic.model3dSuggestions : []

  return {
    ...topic,
    id: topic.id || (slug ? `seed-${slug}` : ''),
    title,
    slug,
    subject: topic.subject || BIOLOGY_SUBJECT.slug,
    subjectTitle: topic.subjectTitle || BIOLOGY_SUBJECT.title,
    difficulty: topic.difficulty || 'beginner',
    visualType: topic.visualType || topic.recommendedVisualType || (topic.model3d ? 'anatomy-3d' : 'interactive-diagram'),
    summary,
    contentBlocks,
    images,
    videos,
    model3d: topic.model3d || null,
    model3dSuggestions,
    quiz,
    chatbotPrompt: topic.chatbotPrompt || topic.aiPrompt || `Explain ${title || 'this topic'} in simple visual language.`,
    recommendedVisualType: topic.recommendedVisualType || topic.visualType || 'interactive-diagram',
    aiPrompt: topic.aiPrompt || topic.chatbotPrompt || ''
  }
}

function buildGenericTopicDraft({ title, subject, difficulty = 'beginner' }) {
  const cleanTitle = titleCase(title.trim())
  const slug = slugify(cleanTitle)
  const visualType = difficulty === 'advanced' ? 'graph' : difficulty === 'intermediate' ? 'interactive-diagram' : 'image-gallery'

  return normalizeTopicRecord({
    title: cleanTitle,
    slug,
    subject: subject || BIOLOGY_SUBJECT.slug,
    subjectTitle: subject || BIOLOGY_SUBJECT.title,
    difficulty,
    visualType,
    summary: `A visually guided introduction to ${cleanTitle}.`,
    contentBlocks: [
      {
        type: 'text',
        heading: `What is ${cleanTitle}?`,
        body: `This draft uses a dynamic content schema so the page can adapt its visuals, explanations, and quiz flow around ${cleanTitle}.`
      },
      {
        type: 'diagram',
        title: 'Key idea map',
        items: ['Start with the concept', 'Show the visual structure', 'Walk through the sequence', 'Check understanding with a quiz']
      },
      {
        type: 'quiz',
        title: 'Quick check',
        questions: baseQuiz(cleanTitle, `the core role of ${cleanTitle.toLowerCase()}`, `The visuals should make the main role easier to remember.`)
      }
    ],
    images: [],
    videos: [],
    model3d: null,
    quiz: baseQuiz(cleanTitle, `the core role of ${cleanTitle.toLowerCase()}`, `The visuals should make the main role easier to remember.`),
    chatbotPrompt: `You are a patient tutor for ${cleanTitle}. Explain the concept in simple terms, use visual analogies, and keep the answer concise.`,
    recommendedVisualType: visualType
  })
}

function createTopicDraft({ title, subject = BIOLOGY_SUBJECT.slug, difficulty = 'beginner' }) {
  const cleanTitle = titleCase(title.trim())
  const normalizedSubject = (subject || BIOLOGY_SUBJECT.slug).toLowerCase()
  const seed = getSeedTopicBySlug(slugify(cleanTitle))

  if (normalizedSubject === BIOLOGY_SUBJECT.slug && seed) {
    return normalizeTopicRecord({
      ...seed,
      title: cleanTitle,
      slug: slugify(cleanTitle),
      difficulty
    })
  }

  if (normalizedSubject === BIOLOGY_SUBJECT.slug && cleanTitle) {
    return buildGenericTopicDraft({ title: cleanTitle, subject: normalizedSubject, difficulty })
  }

  return normalizeTopicRecord({
    title: cleanTitle,
    slug: slugify(cleanTitle),
    subject: normalizedSubject,
    subjectTitle: titleCase(normalizedSubject),
    difficulty,
    visualType: difficulty === 'advanced' ? 'graph' : 'interactive-diagram',
    summary: `A dynamic topic page for ${cleanTitle}.`,
    contentBlocks: [
      {
        type: 'text',
        heading: cleanTitle,
        body: `This topic uses the dynamic content engine and can later be expanded with subject-specific visual blocks.`
      }
    ],
    quiz: [],
    chatbotPrompt: `Explain ${cleanTitle} in a clear, visual, beginner-friendly way.`
  })
}

function getVisualTypeMeta(visualType = '') {
  return visualTypeMeta[visualType] || {
    label: titleCase(visualType || 'Dynamic'),
    summary: 'Adaptive learning view',
    accent: 'from-white/10 to-white/3'
  }
}

export {
  BIOLOGY_SUBJECT,
  BIOLOGY_SEED_TOPICS,
  createTopicDraft,
  getSeedTopicBySlug,
  getSeedTopicsForSubject,
  getVisualTypeMeta,
  normalizeTopicRecord,
  slugify
}