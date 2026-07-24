import {
  Announcement,
  Banner,
  ContactInfo,
  EventItem,
  Facility,
  GalleryImage,
  NewsItem,
  PrincipalMessage,
  ResultRecord,
  Stat,
} from './types';

export const mockBanners: Banner[] = [
  {
    id: 'b1',
    title: 'Welcome to Saarthak GIMSS',
    subtitle: 'Vedic Culture · Scientific Approach · Communication',
    imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200',
    ctaLabel: 'Admissions Open',
    ctaHref: 'contact',
  },
  {
    id: 'b2',
    title: 'Nurturing Future Leaders',
    subtitle: 'Holistic education for classes Nursery to XII',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200',
    ctaLabel: 'See Gallery',
    ctaHref: 'gallery',
  },
  {
    id: 'b3',
    title: 'Annual Sports Day 2026',
    subtitle: 'Celebrating sportsmanship and team spirit',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200',
    ctaLabel: 'View Events',
    ctaHref: 'events',
  },
];

export const mockFacilities: Facility[] = [
  {
    id: 'f1',
    title: 'Our Teachers',
    description: 'Experienced, dedicated educators committed to every child’s growth.',
    icon: 'people',
    imageUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=800',
  },
  {
    id: 'f2',
    title: 'Smart Classrooms',
    description: 'Digitally equipped classrooms for interactive, modern learning.',
    icon: 'school',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800',
  },
  {
    id: 'f3',
    title: 'Library',
    description: 'A well-stocked library encouraging curiosity and reading habits.',
    icon: 'book',
    imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800',
  },
  {
    id: 'f4',
    title: 'Sports Complex',
    description: 'Facilities for athletics, basketball, badminton and more.',
    icon: 'football',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
  },
  {
    id: 'f5',
    title: 'Science Labs',
    description: 'Fully equipped physics, chemistry and biology laboratories.',
    icon: 'flask',
    imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=800',
  },
];

export const mockStats: Stat[] = [
  { id: 's1', label: 'Teachers', value: 22, icon: 'people' },
  { id: 's2', label: 'Students', value: 2759, icon: 'school' },
  { id: 's3', label: 'Events / Year', value: 3, icon: 'calendar' },
  { id: 's4', label: 'Years of Excellence', value: 15, icon: 'ribbon' },
];

export const mockPrincipalMessage: PrincipalMessage = {
  name: 'Dr. A. Sharma',
  role: 'Principal, Saarthak GIMSS',
  photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400',
  message:
    'At Saarthak Global Indian Model Senior Secondary School, we believe education is the harmonious blend of Vedic values, scientific temper and clear communication. Our mission is to nurture confident, compassionate and capable citizens of tomorrow. We welcome you to be a part of our growing family.',
};

export const mockEvents: EventItem[] = [
  {
    id: 'e1',
    title: 'Annual Sports Day',
    date: '2026-09-28',
    location: 'School Grounds, Sector 12-A',
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
    excerpt: 'A day of athletic events, races and team spirit for all classes.',
    body:
      'Our Annual Sports Day brings together students of all age groups for a day filled with track and field events, relay races, and team sports. Parents and guardians are cordially invited to cheer for their children and witness the spirit of healthy competition that Saarthak GIMSS fosters.',
  },
  {
    id: 'e2',
    title: 'Annual Day Celebration',
    date: '2026-12-12',
    location: 'School Auditorium',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    excerpt: 'Cultural performances, prize distribution and much more.',
    body:
      'The Annual Day is one of the most cherished events of the academic year, showcasing dance, drama and musical performances by students. The evening concludes with the distribution of academic and extracurricular excellence awards.',
  },
  {
    id: 'e3',
    title: 'Science Exhibition',
    date: '2026-08-20',
    location: 'Science Block',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
    excerpt: 'Student-led projects showcasing innovation and inquiry.',
    body:
      'Students from Classes VI to XII present working models and research projects across physics, chemistry, biology and environmental science, encouraging scientific curiosity and hands-on learning.',
  },
  {
    id: 'e4',
    title: 'Independence Day Function',
    date: '2026-08-15',
    location: 'School Grounds',
    imageUrl: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800',
    excerpt: 'Flag hoisting, patriotic performances and speeches.',
    body:
      'Saarthak GIMSS celebrates Independence Day with flag hoisting, the national anthem, patriotic skits and speeches by students, honoring the spirit of freedom and unity.',
  },
];

export const mockNews: NewsItem[] = [
  {
    id: 'n1',
    title: 'CBSE Class XII Toppers Announced',
    date: '2026-06-15',
    imageUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
    excerpt: 'Our students excel with outstanding results in CBSE Class XII board exams.',
    body:
      'We are proud to announce that our Class XII students have achieved excellent results in the CBSE board examinations this year, with several students scoring above 95%. Congratulations to all the toppers and their mentors.',
  },
  {
    id: 'n2',
    title: 'New Science Lab Inaugurated',
    date: '2026-07-05',
    imageUrl: 'https://images.unsplash.com/photo-1517976487492-5750f3195933?w=800',
    excerpt: 'A state-of-the-art science laboratory opens for senior students.',
    body:
      'Saarthak GIMSS has inaugurated a new, fully-equipped science laboratory designed to give students hands-on experience with modern instruments and experiments, further strengthening our STEM curriculum.',
  },
  {
    id: 'n3',
    title: 'Inter-School Debate Champions',
    date: '2026-05-22',
    imageUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800',
    excerpt: 'Our debate team wins the district-level competition.',
    body:
      'The school debate team brought home the winning trophy at the district-level inter-school debate competition, showcasing exceptional articulation and critical thinking skills.',
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'a1',
    kind: 'notice',
    title: 'Fee Submission Open for Term 2',
    date: '2026-07-10',
    detail: 'Parents are requested to submit Term 2 fees before 31st July 2026 to avoid late charges.',
  },
  {
    id: 'a2',
    kind: 'holiday',
    title: 'Independence Day Holiday',
    date: '2026-08-15',
    detail: 'The school will remain closed on account of Independence Day.',
  },
  {
    id: 'a3',
    kind: 'news',
    title: 'New Science Lab Opened',
    date: '2026-07-05',
    detail: 'A newly equipped science lab has been inaugurated for senior classes.',
  },
  {
    id: 'a4',
    kind: 'notice',
    title: 'Parent-Teacher Meeting Scheduled',
    date: '2026-07-25',
    detail: 'PTM for all classes will be held in the school auditorium from 9 AM to 1 PM.',
  },
  {
    id: 'a5',
    kind: 'holiday',
    title: 'Raksha Bandhan Holiday',
    date: '2026-08-28',
    detail: 'The school will remain closed on account of Raksha Bandhan.',
  },
];

export const mockGallery: GalleryImage[] = [
  { id: 'g1', imageUrl: 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600', caption: 'Sports Day', album: 'Events' },
  { id: 'g2', imageUrl: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600', caption: 'Campus View', album: 'Campus' },
  { id: 'g3', imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=600', caption: 'Classroom', album: 'Academics' },
  { id: 'g4', imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600', caption: 'Annual Day', album: 'Events' },
  { id: 'g5', imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600', caption: 'Smart Class', album: 'Academics' },
  { id: 'g6', imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600', caption: 'Science Fair', album: 'Events' },
  { id: 'g7', imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600', caption: 'Sports Complex', album: 'Campus' },
  { id: 'g8', imageUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600', caption: 'Library', album: 'Campus' },
];

export const mockContact: ContactInfo = {
  address: 'Saarthak GIMSS, Sector 12-A, Panchkula, Haryana 134109',
  phone: '+91 90000 00000',
  email: 'info@saarthakgimsss12a.org',
  mapUrl: 'https://maps.google.com/?q=Sector+12A+Panchkula',
  social: {
    facebook: 'https://facebook.com',
    youtube: 'https://youtube.com',
    instagram: 'https://instagram.com',
  },
};

export const mockResults: Record<string, ResultRecord> = {
  '8A-23': {
    studentName: 'Rohan Verma',
    className: 'Class VIII-A',
    rollNo: '23',
    term: 'Term 1, 2026',
    percentage: 88.4,
    subjects: [
      { name: 'English', marks: 86, max: 100, grade: 'A' },
      { name: 'Hindi', marks: 82, max: 100, grade: 'A' },
      { name: 'Mathematics', marks: 91, max: 100, grade: 'A+' },
      { name: 'Science', marks: 89, max: 100, grade: 'A' },
      { name: 'Social Science', marks: 94, max: 100, grade: 'A+' },
    ],
  },
};

export function findMockResult(className: string, roll: string): ResultRecord | undefined {
  const key = Object.keys(mockResults).find(
    (k) => k.toLowerCase() === `${className}-${roll}`.toLowerCase()
  );
  if (key) return mockResults[key];
  if (!className || !roll || roll.trim() === '000') return undefined;
  // Fallback: any other lookup returns a sample record so the flow can be demoed.
  if (className && roll) {
    return {
      ...mockResults['8A-23'],
      className,
      rollNo: roll,
    };
  }
  return undefined;
}
