import { useEffect } from 'react'

const COURSE_DETAILS = {
  'ap-biology': {
    id: 'ap-biology',
    title: 'AP Biology',
    subtitle: 'Signature 1-on-1 Exam Preparation',
    tag: 'AP Exam Prep · Units 1–8',
    target: 'High school students taking AP Biology in 2026–2028 aiming for scores of 4 or 5.',
    description: 'Comprehensive, mechanism-first instruction covering the complete College Board AP Biology curriculum. We decode multi-step biochemical cascades, train stimulus-based MCQ accuracy, and practice rubric-calibrated FRQs weekly.',
    units: [
      { num: 'Unit 1', name: 'Chemistry of Life', topics: 'Structure of water, hydrogen bonding, macromolecule monomers & polymers, nucleic acid directionality.' },
      { num: 'Unit 2', name: 'Cell Structure & Function', topics: 'Surface area-to-volume ratios, plasma membrane mechanics, tonicity, osmoregulation, compartmentalization.' },
      { num: 'Unit 3', name: 'Cellular Energetics', topics: 'Enzyme kinetics & inhibition, photosynthesis (light reactions & Calvin cycle), cellular respiration, fermentation.' },
      { num: 'Unit 4', name: 'Cell Communication & Cell Cycle', topics: 'Signal transduction cascades, G-protein receptors, phosphorylation, feedback loops, mitosis & checkpoints.' },
      { num: 'Unit 5', name: 'Heredity', topics: 'Meiosis, crossing over, Mendelian ratios, sex-linked traits, gene linkage & recombination frequency, phenotypic plasticity.' },
      { num: 'Unit 6', name: 'Gene Expression & Regulation', topics: 'DNA/RNA replication, operons, transcription factors, epigenetic modification, mutations, gel electrophoresis, PCR.' },
      { num: 'Unit 7', name: 'Natural Selection', topics: 'Hardy-Weinberg equilibrium, phylogenetic trees, cladograms, speciation mechanisms, directional/stabilizing selection.' },
      { num: 'Unit 8', name: 'Ecology', topics: 'Energy transfer (10% rule), population growth models (logistic & exponential), symbiotic interactions, biodiversity resilience.' }
    ],
    frqMastery: [
      'Question 1: Interpreting and evaluating experimental results (8–10 pts with controls & hypotheses).',
      'Question 2: Graphing, error bar analysis (±2 SEM), and chi-square goodness-of-fit testing.',
      'Questions 3–6: Scientific investigation, conceptual models, and mechanism justifications.'
    ],
    outcomes: [
      'Mastery of College Board experimental design command terms (predict, justify, calculate).',
      'Line-by-line scoring against authentic College Board grading rubrics.',
      'Individualized error tracking log to eliminate recurring conceptual traps.'
    ]
  },
  'apes': {
    id: 'apes',
    title: 'AP Environmental Science (APES)',
    subtitle: 'Interdisciplinary Science & Quantitative Analysis',
    tag: 'AP Exam Prep · Units 1–9',
    target: 'High school students taking APES seeking top scores through data interpretation and calculation mastery.',
    description: 'A quantitative and conceptual deep dive into earth systems, resource allocation, pollution dynamics, and conservation ecology, with dedicated focus on APES math calculations (no calculators allowed on historical questions).',
    units: [
      { num: 'Unit 1', name: 'The Living World: Ecosystems', topics: 'Biomes, carbon/nitrogen/phosphorus cycles, primary productivity, food webs.' },
      { num: 'Unit 2', name: 'The Living World: Biodiversity', topics: 'Ecosystem services, island biogeography, ecological tolerance, natural disruptions.' },
      { num: 'Unit 3', name: 'Populations', topics: 'Generalist vs specialist, survivorship curves, carrying capacity, human population demographics.' },
      { num: 'Unit 4', name: 'Earth Systems & Resources', topics: 'Plate tectonics, soil properties & erosion, watershed dynamics, El Niño/La Niña cycles.' },
      { num: 'Unit 5', name: 'Land & Water Use', topics: 'Tragedy of the commons, irrigation methods, agricultural practices, mining, urban runoff.' },
      { num: 'Unit 6', name: 'Energy Resources & Consumption', topics: 'Renewable vs fossil fuels, nuclear power, hydroelectric, wind, energy conservation math.' },
      { num: 'Unit 7', name: 'Atmospheric Pollution', topics: 'Photochemical smog, thermal inversions, acid rain, indoor air pollutants, reduction technologies.' },
      { num: 'Unit 8', name: 'Aquatic & Terrestrial Pollution', topics: 'Point vs nonpoint sources, bioaccumulation/biomagnification, wastewater treatment, LD50 toxicity.' },
      { num: 'Unit 9', name: 'Global Change', topics: 'Stratospheric ozone depletion, greenhouse effect, ocean acidification, invasive species, extinction.' }
    ],
    frqMastery: [
      'Question 1: Design an investigation regarding an environmental problem.',
      'Question 2: Analyze an environmental problem and propose an evidence-backed solution.',
      'Question 3: Analyze an environmental issue and perform multi-step math calculations.'
    ],
    outcomes: [
      'Fluency with dimensional analysis, half-life formulas, and trophic energy loss calculations.',
      'Accurate synthesis of environmental legislation (Clean Air Act, Clean Water Act, CITES).',
      'Systematic FRQ answer framing according to recent AP rubrics.'
    ]
  },
  'ap-psychology': {
    id: 'ap-psychology',
    title: 'AP Psychology',
    subtitle: 'Scientific Foundations of Behavior & Cognition',
    tag: 'AP Exam Prep · High-Yield Focus',
    target: 'Students seeking a 5 in AP Psychology through rigorous understanding of neurobiology and empirical research methods.',
    description: 'Instruction designed to turn memorization into structural understanding. We emphasize the biological mechanisms of the nervous system, cognitive models, and the updated College Board research methodology requirements.',
    units: [
      { num: 'Unit 1', name: 'Biological Bases of Behavior', topics: 'Neuron anatomy, action potentials, neurotransmitters, brain lobes, endocrine system, split-brain studies.' },
      { num: 'Unit 2', name: 'Cognition & Memory', topics: 'Encoding/storage/retrieval models, forgetfulness curves, heuristics, problem-solving biases, language development.' },
      { num: 'Unit 3', name: 'Development & Learning', topics: 'Classical & operant conditioning, Piaget stages, Erikson psychosocial crises, Kohlberg moral development.' },
      { num: 'Unit 4', name: 'Social & Clinical Psychology', topics: 'Attribution theory, conformity, cognitive dissonance, DSM-5-TR disorders, evidence-based psychotherapies.' },
      { num: 'Unit 5', name: 'Research Methods & Ethics', topics: 'Independent/dependent variables, confounding variables, correlation vs causation, ethical IRB standards.' }
    ],
    frqMastery: [
      'Concept Application (AAQ): Applying psychological theories to realistic novel scenarios.',
      'Research Design (EBQ): Formulating hypotheses, evaluating confounding variables, and calculating ethical validity.'
    ],
    outcomes: [
      'Complete mastery of high-frequency neuroanatomy and neurotransmitter distinctions.',
      'Confident, concise FRQ paragraph structure that captures full rubric points.',
      'Strong statistical literacy (standard deviation, p-value interpretation, normal distribution).'
    ]
  },
  'usabo': {
    id: 'usabo',
    title: 'USA Biology Olympiad (USABO)',
    subtitle: 'Competitive Advanced Life Science Enrichment',
    tag: 'Competitive Olympiad · Campbell Deep-Dive',
    target: 'Motivated students preparing for the USABO Semifinalist and National competitions.',
    description: 'An elite, rigorous curriculum built around Campbell Biology and advanced university-level texts. We train students to decipher dense experimental figures, solve pedigree probabilities, and master plant & animal physiology at an Olympiad standard.',
    units: [
      { num: 'Module 1', name: 'Biochemistry & Molecular Biology', topics: 'Bioenergetics, macromolecular crystallography, post-translational modifications, recombinant DNA.' },
      { num: 'Module 2', name: 'Plant Anatomy & Physiology', topics: 'Xylem/phloem transport mechanisms, C3/C4/CAM pathways, photoperiodism, phytochrome signaling.' },
      { num: 'Module 3', name: 'Animal Anatomy & Physiology', topics: 'Comparative physiology, countercurrent exchange, endocrine loops, immunology (innate vs adaptive).' },
      { num: 'Module 4', name: 'Genetics & Evolution', topics: 'Non-Mendelian probability, tetrad analysis, population genetics, Hardy-Weinberg extensions, cladistics.' },
      { num: 'Module 5', name: 'Ethology, Ecology & Biosystematics', topics: 'Optimal foraging, animal behavior paradigms, niche partitioning, phylogenetic matrix analysis.' }
    ],
    frqMastery: [
      'High-speed problem analysis across multi-tiered data tables.',
      'University-level biochemical pathway questions and experimental design critiques.'
    ],
    outcomes: [
      'Deep conceptual command of Campbell Biology (11th/12th Edition).',
      'Timed practice sets under authentic USABO exam conditions.',
      'Targeted preparation for qualification as a USABO Semifinalist.'
    ]
  }
}

function CourseModal({ courseId, onClose }) {
  const course = COURSE_DETAILS[courseId]

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose])

  if (!course) return null

  return (
    <div className="assignment-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="course-modal-title">
      <div className="assignment-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', maxHeight: '88vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div className="assignment-modal-header" style={{ position: 'sticky', top: 0, background: 'var(--surface, #0E2219)', zIndex: 10 }}>
          <div>
            <div className="modal-tag-row">
              <span className="modal-topic-tag" style={{ background: 'rgba(52, 211, 153, 0.15)', color: 'var(--mint, #34D399)' }}>
                {course.tag}
              </span>
            </div>
            <h2 id="course-modal-title" className="modal-assignment-title" style={{ fontSize: '24px', fontFamily: "var(--ff-sora, 'Sora', sans-serif)" }}>
              {course.title}
            </h2>
            <p style={{ color: 'var(--text-2, #A9C2B5)', fontSize: '13px', marginTop: '4px' }}>
              {course.subtitle}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-icon-btn"
            onClick={onClose}
            aria-label="Close syllabus dialog"
          >
            <ion-icon name="close-outline"></ion-icon>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Target Audience & Overview */}
          <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid var(--line, #24493A)', borderRadius: '12px', padding: '16px 20px' }}>
            <h4 style={{ color: 'var(--mint, #34D399)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Target Student Profile
            </h4>
            <p style={{ color: 'var(--text, #EAF5EE)', fontSize: '14px', lineHeight: 1.5 }}>
              {course.target}
            </p>
            <p style={{ color: 'var(--text-2, #A9C2B5)', fontSize: '13px', marginTop: '8px', lineHeight: 1.5 }}>
              {course.description}
            </p>
          </div>

          {/* Core Curriculum Units */}
          <div>
            <h3 style={{ fontSize: '17px', color: 'var(--text, #EAF5EE)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ion-icon name="list-outline" style={{ color: 'var(--mint, #34D399)' }}></ion-icon>
              <span>Curriculum Scope &amp; Sequence</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
              {course.units.map((unit, idx) => (
                <div key={idx} style={{ background: 'var(--surface, #0E2219)', border: '1px solid var(--line, #24493A)', borderRadius: '10px', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--ff-mono)', color: 'var(--mint, #34D399)', fontWeight: 700 }}>
                      {unit.num}
                    </span>
                    <strong style={{ fontSize: '13px', color: 'var(--text, #EAF5EE)' }}>{unit.name}</strong>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-2, #A9C2B5)', lineHeight: 1.4 }}>
                    {unit.topics}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* FRQ & Rubric Mastery */}
          <div>
            <h3 style={{ fontSize: '17px', color: 'var(--text, #EAF5EE)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ion-icon name="document-text-outline" style={{ color: 'var(--mint, #34D399)' }}></ion-icon>
              <span>Targeted Exam Mastery</span>
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
              {course.frqMastery.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text, #EAF5EE)', lineHeight: 1.5 }}>
                  <ion-icon name="checkmark-circle" style={{ color: 'var(--mint, #34D399)', fontSize: '18px', flexShrink: 0, marginTop: '2px' }}></ion-icon>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Student Outcomes */}
          <div>
            <h3 style={{ fontSize: '17px', color: 'var(--text, #EAF5EE)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ion-icon name="ribbon-outline" style={{ color: 'var(--mint, #34D399)' }}></ion-icon>
              <span>Instructional Outcomes</span>
            </h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
              {course.outcomes.map((item, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: 'var(--text-2, #A9C2B5)', lineHeight: 1.5 }}>
                  <ion-icon name="star-outline" style={{ color: 'var(--amber, #F5B83D)', fontSize: '16px', flexShrink: 0, marginTop: '2px' }}></ion-icon>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTA Row */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid var(--line, #24493A)' }}>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSc615afQFRpiaWyfpmTKWOBSGzOYmZDcg95rZZ9u3HKvBbT8g/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="hero-cta-btn primary"
              style={{ textDecoration: 'none' }}
            >
              <ion-icon name="calendar-outline"></ion-icon>
              <span>Book Free Consultation for this Course</span>
            </a>
            <button
              type="button"
              className="hero-cta-btn secondary"
              onClick={onClose}
            >
              <span>Close Syllabus</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default CourseModal
