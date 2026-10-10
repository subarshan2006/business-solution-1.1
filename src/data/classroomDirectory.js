/**
 * Classroom Directory & Configuration
 * Provides initial metadata and localStorage persistence for private 1-on-1 tutoring classrooms.
 * When Google Classroom API has prior announcements (Option A), parent name & session numbers
 * are auto-extracted from the API stream. This directory provides defaults and fallback data.
 */

export const DEFAULT_CLASSROOMS_DIRECTORY = [
  {
    index: 1,
    studentName: 'Samyuktha',
    parentName: 'Ms. Sambhrama',
    subject: 'AP Biology',
    grade: 'Grade 10',
    topics: [
      'Unit 2 :- Cell organelles - Cytoskeleton, peroxisomes, ECM and cell junctions.',
      'Unit 3 :- Cellular Energetics - Enzyme kinetics, inhibition and ATP synthase.',
      'Unit 4 :- Cell Communication - Signal transduction and phosphorylation cascades.',
    ],
    defaultHw: 'Unit 2 workbook page numbers 7 through 20',
    defaultRemarks: 'Revised the concepts from the last classes and completed cell organelles. Practiced MCQs and reviewed FRQ rubric.',
  },
  {
    index: 2,
    studentName: 'Alex Rivera',
    parentName: 'Mr. Carlos Rivera',
    subject: 'AP Environmental Science',
    grade: 'Grade 11',
    topics: [
      'Unit 1 :- The Living World: Ecosystems - Biomes, biogeochemical cycles & primary productivity.',
      'Unit 2 :- Biodiversity - Island biogeography, ecological tolerance & natural disruptions.',
      'Unit 3 :- Populations - Survivorship curves, carrying capacity & demographic transition.',
    ],
    defaultHw: 'Biogeochemical cycles worksheet and AP Classroom Unit 1 progress check',
    defaultRemarks: 'Great participation during nitrogen & phosphorus cycle review. Practice quantitative math calculations for primary productivity before next session.',
  },
  {
    index: 3,
    studentName: 'Sophia Chen',
    parentName: 'Dr. Mei Chen',
    subject: 'AP Psychology',
    grade: 'Grade 12',
    topics: [
      'Unit 2 :- Biological Bases of Behavior - Neural transmission, neurotransmitters & endocrine system.',
      'Unit 3 :- Sensation and Perception - Visual processing, auditory pathways & gestalt principles.',
      'Unit 5 :- Cognitive Psychology - Memory encoding, retrieval failure & cognitive biases.',
    ],
    defaultHw: 'Neuroanatomy labeling quiz and 30 multiple-choice questions on Action Potential',
    defaultRemarks: 'Excellent mastery of nervous system structures. Focused today on distinguishing agonists from antagonists in neurotransmitter function.',
  },
  {
    index: 4,
    studentName: 'Rohan Sharma',
    parentName: 'Mrs. Sunita Sharma',
    subject: 'USABO Prep',
    grade: 'Grade 11',
    topics: [
      'Campbell Biology Chapter 4-7 :- Macromolecules, lipids, membrane transport & thermodynamics.',
      'Chapter 8-10 :- Glycolysis, Krebs cycle, electron transport & oxidative phosphorylation.',
      'Chapter 12-14 :- Cell division, meiosis, Mendelian genetics and chromosomal inheritance.',
    ],
    defaultHw: 'USABO 2024 Semifinal Exam Part A questions 1 to 25 with full justifications',
    defaultRemarks: 'Covered Campbell chapter 6 membrane transport mechanisms. Worked through 5 olympiad-level problem sets on osmotic potential and Nernst equation.',
  },
  {
    index: 5,
    studentName: 'Emily Watson',
    parentName: 'Mr. David Watson',
    subject: 'Biochemistry',
    grade: 'Grade 10',
    topics: [
      'Module 1 :- Amino Acid Chemistry - Zwitterions, titration curves & isoelectric points.',
      'Module 2 :- Protein Structure - Alpha helices, beta sheets & tertiary stabilization forces.',
      'Module 3 :- Enzyme Kinetics - Michaelis-Menten derivation, Lineweaver-Burk plots & inhibitors.',
    ],
    defaultHw: 'Amino acid pKa calculations problem set 4 and Michaelis-Menten graphing exercise',
    defaultRemarks: 'Practiced amino acid titration curve calculations and determined pI values accurately. Ready to advance to Lineweaver-Burk plots.',
  },
  {
    index: 6,
    studentName: 'Aarav Patel',
    parentName: 'Mr. Rajesh Patel',
    subject: 'AP Biology',
    grade: 'Grade 11',
    topics: [
      'Unit 5 :- Heredity - Mendelian genetics, non-Mendelian inheritance & chi-square analysis.',
      'Unit 6 :- Gene Expression - DNA replication, transcription, RNA processing & translation.',
      'Unit 7 :- Natural Selection - Hardy-Weinberg equilibrium, phylogenetics & speciation.',
    ],
    defaultHw: 'Chi-square test worksheet and 20 practice questions on linked genes',
    defaultRemarks: 'Strong grasp of monohybrid and dihybrid crosses. Clarified non-Mendelian exceptions like incomplete dominance and epistasis.',
  },
  {
    index: 7,
    studentName: 'Chloe Bennett',
    parentName: 'Mrs. Rebecca Bennett',
    subject: 'AP Environmental Science',
    grade: 'Grade 10',
    topics: [
      'Unit 4 :- Earth Systems & Resources - Plate tectonics, soil composition & atmospheric circulation.',
      'Unit 5 :- Land and Water Use - Agriculture, irrigation, pest management & meat production.',
      'Unit 6 :- Energy Resources - Fossil fuels, nuclear power & renewable energy technologies.',
    ],
    defaultHw: 'Soil texture triangle analysis lab report and Unit 4 practice FRQ',
    defaultRemarks: 'Detailed discussion on Hadley cells and Coriolis effect. Assigned soil horizons worksheet for reinforcement before next class.',
  },
  {
    index: 8,
    studentName: 'Kevin Zhao',
    parentName: 'Dr. Wei Zhao',
    subject: 'AP Psychology',
    grade: 'Grade 11',
    topics: [
      'Unit 6 :- Developmental Psychology - Piaget stages, Kohlberg morality & Erikson psychosocial.',
      'Unit 7 :- Motivation, Emotion and Personality - Freud psychodynamics & humanistic theory.',
      'Unit 8 :- Clinical Psychology - DSM-5 classifications, anxiety, mood & psychotic disorders.',
    ],
    defaultHw: 'Piaget vs Vygotsky comparative essay and Case Study Diagnosis Worksheet #2',
    defaultRemarks: 'Analyzed developmental milestones thoroughly. Kevin demonstrated strong analytical thinking during Kohlberg moral dilemma case studies.',
  },
  {
    index: 9,
    studentName: 'Maya Krishnan',
    parentName: 'Dr. Anand Krishnan',
    subject: 'USABO Prep',
    grade: 'Grade 12',
    topics: [
      'Plant Biology Section :- Meristems, xylem/phloem transport, phototropism & phytochromes.',
      'Animal Physiology Section :- Action potential conduction, synaptic transmission & muscle twitch.',
      'Ethology Section :- FAP, associative learning, kin selection & Hamilton rule.',
    ],
    defaultHw: 'Campbell Biology Chapters 35-39 plant anatomy review problems and 2025 Open Exam questions',
    defaultRemarks: 'Deep dive into plant vascular bundle anatomy and pressure flow hypothesis in phloem. Handled competition level questions with high accuracy.',
  },
  {
    index: 10,
    studentName: 'Lucas Miller',
    parentName: 'Mrs. Jennifer Miller',
    subject: 'Biochemistry',
    grade: 'Grade 12',
    topics: [
      'Bioenergetics :- Gibbs free energy, coupled reactions & standard reduction potentials.',
      'Metabolic Pathways :- Glycolytic regulation, phosphofructokinase-1 allostery & gluconeogenesis.',
      'Lipid Metabolism :- Beta-oxidation, fatty acid synthesis & ketone bodies.',
    ],
    defaultHw: 'Gibbs Free Energy practice calculations and PFK-1 regulatory mechanism summary sheet',
    defaultRemarks: 'Lucas mastered ΔG°′ calculations and coupled reaction ATP stoichiometry today. Next session will explore pyruvate dehydrogenase regulation.',
  },
  {
    index: 11,
    studentName: 'Ananya Iyer',
    parentName: 'Mrs. Geetha Iyer',
    subject: 'AP Biology',
    grade: 'Grade 10',
    topics: [
      'Unit 1 :- Chemistry of Life - Water hydrogen bonding, carbon skeleton & functional groups.',
      'Unit 2 :- Cell Structure - Surface area to volume ratios & endosymbiotic theory.',
      'Unit 3 :- Cellular Energetics - Photosynthesis light vs dark reactions.',
    ],
    defaultHw: 'Unit 1 College Board Question Bank Set A and Water Properties lab analysis',
    defaultRemarks: 'Reviewed properties of water, adhesion/cohesion, and specific heat. Ananya completed all diagnostic questions with zero errors.',
  },
  {
    index: 12,
    studentName: 'Ethan Brooks',
    parentName: 'Mr. Robert Brooks',
    subject: 'AP Environmental Science',
    grade: 'Grade 11',
    topics: [
      'Unit 7 :- Atmospheric Pollution - Photochemical smog, thermal inversions & acid deposition.',
      'Unit 8 :- Aquatic Pollution - Eutrophication, bioaccumulation, endocrine disruptors & LD50.',
      'Unit 9 :- Global Change - Stratospheric ozone depletion & greenhouse gas radiative forcing.',
    ],
    defaultHw: 'Photochemical smog chemical equations worksheet and LD50 dose-response graph interpretation',
    defaultRemarks: 'Walked through tropospheric ozone formation vs stratospheric ozone depletion mechanisms. Excellent questions on primary vs secondary air pollutants.',
  },
  {
    index: 13,
    studentName: 'Zoe Martinez',
    parentName: 'Ms. Maria Martinez',
    subject: 'AP Psychology',
    grade: 'Grade 10',
    topics: [
      'Unit 1 :- History and Approaches - Structuralism, functionalism, behavioral & cognitive.',
      'Unit 4 :- Learning - Pavlovian classical conditioning, Skinner operant conditioning & schedules.',
      'Unit 9 :- Social Psychology - Conformity, obedience, cognitive dissonance & bystander effect.',
    ],
    defaultHw: 'Reinforcement schedules identification drill (25 prompts) and Milgram experiment analysis',
    defaultRemarks: 'Clarified positive/negative reinforcement vs punishment distinctions. Completed quick-fire drill with 95% accuracy.',
  },
  {
    index: 14,
    studentName: 'Devansh Nair',
    parentName: 'Mr. Suresh Nair',
    subject: 'USABO Prep',
    grade: 'Grade 11',
    topics: [
      'Molecular Genetics :- Operons (lac and trp), eukaryotic epigenetic regulation & CRISPR-Cas9.',
      'Developmental Biology :- Maternal effect genes, Hox genes & organizer experiments in amphibians.',
      'Immunology :- Innate vs adaptive immunity, V(D)J recombination & MHC class I/II.',
    ],
    defaultHw: 'Campbell Chapter 20 biotechnology problem set and 2023 USABO Semifinal genetics portion',
    defaultRemarks: 'Covered lac and trp operon negative and positive control circuits in detail. Solved high-difficulty regulatory mutation scenarios.',
  },
  {
    index: 15,
    studentName: 'Hannah Kim',
    parentName: 'Mrs. Grace Kim',
    subject: 'Biochemistry',
    grade: 'Grade 11',
    topics: [
      'Nucleic Acids :- DNA B-form vs A-form vs Z-form, hyperchromicity & PCR thermodynamics.',
      'Membrane Biophysics :- Fluid mosaic model, lipid rafts, FRAP & patch clamp electrophysiology.',
      'Signal Transduction :- GPCRs, G-proteins, adenylate cyclase, IP3/DAG & tyrosine kinases.',
    ],
    defaultHw: 'DNA melting curve temperature calculation worksheet and GPCR pathway diagram',
    defaultRemarks: 'Great focus during our exploration of GPCR signaling cascades and second messengers. Hannah demonstrated thorough understanding of kinase cascades.',
  },
  {
    index: 16,
    studentName: 'Vikram Sengupta',
    parentName: 'Dr. Joy Sengupta',
    subject: 'AP Biology',
    grade: 'Grade 12',
    topics: [
      'Unit 6 :- Biotechnology - Gel electrophoresis, restriction digests, plasmids & transformation.',
      'Unit 7 :- Evolutionary Biology - Cladograms, molecular clocks & reproductive isolation.',
      'Unit 8 :- Ecology - Community interactions, trophic cascades & ecosystem stability.',
    ],
    defaultHw: 'Plasmid mapping restriction digest worksheet and College Board Transformation Lab FRQ',
    defaultRemarks: 'Practiced mapping restriction fragments on plasmid circles. Vikram solved the multi-enzyme digest puzzle accurately within 10 minutes.',
  },
  {
    index: 17,
    studentName: 'Olivia Taylor',
    parentName: 'Mr. Mark Taylor',
    subject: 'AP Environmental Science',
    grade: 'Grade 12',
    topics: [
      'Renewable Energy Deep-Dive :- Photovoltaic efficiency, hydroelectric dams & geothermal heat pumps.',
      'Sustainable Forestry & Fishery :- Maximum sustainable yield, clearcutting vs selective cutting.',
      'Urban Runoff & Mitigation :- Permeable pavement, rain gardens & green roofs.',
    ],
    defaultHw: 'Maximum Sustainable Yield calculation problems and Renewable Energy FRQ timed practice',
    defaultRemarks: 'Engaged discussion on ecological trade-offs of large dams and renewable micro-grids. Prepared outline for the environmental legislation review.',
  },
  {
    index: 18,
    studentName: 'Arjun Das',
    parentName: 'Mrs. Neha Das',
    subject: 'AP Psychology',
    grade: 'Grade 11',
    topics: [
      'Cognitive Psychology :- Heuristics (availability & representativeness), mental sets & algorithms.',
      'Language Acquisition :- Chomsky LAD, Broca vs Wernicke aphasias & linguistic relativity.',
      'Intelligence Testing :- Spearman g factor, Gardner multiple intelligences & WAIS psychometrics.',
    ],
    defaultHw: 'Cognitive biases real-world examples portfolio and Intelligence testing history review sheet',
    defaultRemarks: 'Covered language acquisition stages and neurological centers. Arjun analyzed case studies on expressive vs receptive aphasia with precision.',
  },
  {
    index: 19,
    studentName: 'Natalie Ross',
    parentName: 'Mrs. Karen Ross',
    subject: 'USABO Prep',
    grade: 'Grade 12',
    topics: [
      'Endocrinology :- Peptide vs steroid hormone mechanisms, hypothalamus-pituitary feedback loops.',
      'Renal Physiology :- Nephron countercurrent multiplier system, glomerulus filtration & ADH/RAAS.',
      'Cardiovascular Dynamics :- Cardiac cycle, Frank-Starling law, ECG waveforms & hemodynamics.',
    ],
    defaultHw: 'Nephron countercurrent multiplier osmolarity map and 2024 USABO Semifinal physiology section',
    defaultRemarks: 'Mastered the renal countercurrent multiplier gradient and RAAS hormonal control loop today. Exceptional work on difficult physiology questions.',
  },
  {
    index: 20,
    studentName: 'Rishi Varma',
    parentName: 'Mr. Arvind Varma',
    subject: 'Biochemistry',
    grade: 'Grade 10',
    topics: [
      'Metabolism Regulation :- Citric acid cycle checkpoints, isocitrate dehydrogenase allostery.',
      'Electron Transport Chain :- Complexes I-IV, cytochrome c, ubiquinone & proton motive force.',
      'Photosynthetic Complexes :- RuBisCO oxygenase activity, photorespiration & C4/CAM adaptations.',
    ],
    defaultHw: 'ETC proton gradient stoichiometry problem set and C3 vs C4 leaf anatomy comparison table',
    defaultRemarks: 'Walked through ATP synthase rotary mechanism and uncoupler (DNP) effects on thermogenesis. Rishi grasped chemiosmotic coupling thoroughly.',
  },
]

const LOCAL_STORAGE_KEY = 'nxtstep_classroom_overrides'

/**
 * Retrieve saved overrides from localStorage
 */
export function getSavedClassroomOverrides() {
  if (typeof window === 'undefined' || !window.localStorage) return {}
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch (err) {
    console.warn('Failed to load classroom overrides from localStorage:', err)
    return {}
  }
}

/**
 * Save per-classroom overrides to localStorage
 */
export function saveClassroomOverride(courseId, details) {
  if (!courseId || !details) return
  if (typeof window === 'undefined' || !window.localStorage) return
  try {
    const existing = getSavedClassroomOverrides()
    existing[courseId] = {
      ...existing[courseId],
      ...details,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing))
  } catch (err) {
    console.warn('Failed to save classroom override:', err)
  }
}

/**
 * Find default directory entry by course index, courseId, or courseName
 */
export function findDirectoryEntry(courseId = '', courseName = '') {
  if (!courseId && !courseName) return null

  // 1. Try matching by index pattern in ID (e.g. course-classroom-03)
  const numMatch = (courseId || courseName).match(/(\d+)/)
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10)
    const foundByIndex = DEFAULT_CLASSROOMS_DIRECTORY.find((d) => d.index === idx)
    if (foundByIndex) return foundByIndex
  }

  // 2. Try matching student name in course name (e.g. "Samyuktha — AP Biology")
  if (courseName) {
    const foundByName = DEFAULT_CLASSROOMS_DIRECTORY.find((d) =>
      courseName.toLowerCase().includes(d.studentName.toLowerCase())
    )
    if (foundByName) return foundByName
  }

  return DEFAULT_CLASSROOMS_DIRECTORY[0]
}

/**
 * Get unified classroom details merging:
 * 1. Default directory
 * 2. User's saved localStorage overrides
 */
export function getClassroomDirectoryDetails(courseId = '', courseName = '') {
  const defaultEntry = findDirectoryEntry(courseId, courseName) || DEFAULT_CLASSROOMS_DIRECTORY[0]
  const overrides = getSavedClassroomOverrides()
  const custom = overrides[courseId] || overrides[courseName] || {}

  return {
    studentName: custom.studentName || defaultEntry.studentName,
    parentName: custom.parentName || defaultEntry.parentName,
    subject: custom.subject || defaultEntry.subject,
    grade: custom.grade || defaultEntry.grade,
    topics: custom.topics || defaultEntry.topics,
    defaultHw: custom.defaultHw || defaultEntry.defaultHw,
    defaultRemarks: custom.defaultRemarks || defaultEntry.defaultRemarks,
    hasCustomOverride: Boolean(custom.studentName || custom.parentName),
  }
}
