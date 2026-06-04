const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { User, Match, Notification, ActivityLog } = require('./models');

const seedUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice@skillswap.com',
    password: 'password123',
    skills: ['React', 'JavaScript', 'CSS', 'Figma'],
    interests: ['Python', 'Machine Learning', 'Data Science'],
    bio: 'Frontend developer looking to transition into data science. Can help you build beautiful, interactive UI/UX interfaces with React.'
  },
  {
    name: 'Bob Smith',
    email: 'bob@skillswap.com',
    password: 'password123',
    skills: ['Python', 'Flask', 'SQL', 'Machine Learning'],
    interests: ['React', 'UI/UX Design'],
    bio: 'Data scientist and Python programmer. I build backend models but lack front-end polish. Let us exchange skills!'
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@skillswap.com',
    password: 'password123',
    skills: ['Data Science', 'Python', 'Pandas', 'Jupyter'],
    interests: ['Figma', 'CSS', 'HTML'],
    bio: 'Data analyst working with Python. I want to learn website layouts, graphic design, and prototyping in Figma.'
  },
  {
    name: 'Diana Prince',
    email: 'diana@skillswap.com',
    password: 'password123',
    skills: ['UI/UX Design', 'Figma', 'Graphic Design'],
    interests: ['JavaScript', 'React', 'Node.js'],
    bio: 'Senior UX designer. I make interactive mockups but want to learn how to code them into functional web applications.'
  },
  {
    name: 'Ethan Hunt',
    email: 'ethan@skillswap.com',
    password: 'password123',
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker'],
    interests: ['Spanish', 'French', 'Public Speaking'],
    bio: 'Backend developer interested in learning European languages and polishing presentation skills for conferences.'
  },
  {
    name: 'Fiona Gallagher',
    email: 'fiona@skillswap.com',
    password: 'password123',
    skills: ['Spanish', 'French', 'English Literature'],
    interests: ['Python', 'Web Scraping'],
    bio: 'Bilingual language tutor. I want to automate my workflow by learning Python and web scraping to fetch study resources.'
  },
  {
    name: 'George Costanza',
    email: 'george@skillswap.com',
    password: 'password123',
    skills: ['Public Speaking', 'Negotiation', 'Creative Writing'],
    interests: ['SQL', 'Excel', 'Data Analysis'],
    bio: 'Negotiator and storyteller. I want to learn the technical side of corporate data, especially Excel and database queries.'
  },
  {
    name: 'Hannah Baker',
    email: 'hannah@skillswap.com',
    password: 'password123',
    skills: ['Photography', 'Photoshop', 'Video Editing'],
    interests: ['UI/UX Design', 'Figma'],
    bio: 'Freelance photographer. Wanting to learn UI/UX design to build my portfolio site. Happy to teach Photoshop & photography basics.'
  },
  {
    name: 'Ian Malcolm',
    email: 'ian@skillswap.com',
    password: 'password123',
    skills: ['Mathematics', 'Statistics', 'R Programming'],
    interests: ['Photography', 'Video Editing'],
    bio: 'Math professor. I want to learn the art of composition, lighting, and basic video editing to record lectures.'
  },
  {
    name: 'Julia Roberts',
    email: 'julia@skillswap.com',
    password: 'password123',
    skills: ['Acting', 'Creative Writing', 'Public Speaking'],
    interests: ['Piano', 'Music Theory'],
    bio: 'Creative writer and actor. I have always wanted to learn piano. Can teach public speaking or write copy/stories for your projects.'
  },
  {
    name: 'Kevin Hart',
    email: 'kevin@skillswap.com',
    password: 'password123',
    skills: ['Stand-up Comedy', 'Improv', 'Screenwriting'],
    interests: ['Spanish', 'Guitar'],
    bio: 'Comedian looking to learn Spanish for international tours and guitar for fun. Can teach you how to write funny scripts or stand up.'
  },
  {
    name: 'Laura Croft',
    email: 'laura@skillswap.com',
    password: 'password123',
    skills: ['Gymnastics', 'Survival Skills', 'History'],
    interests: ['Photography', 'Drone Piloting'],
    bio: 'Explorer and history buff. Looking to pick up photography and drone piloting to record remote archeological sites.'
  },
  {
    name: 'Michael Scott',
    email: 'michael@skillswap.com',
    password: 'password123',
    skills: ['Sales', 'Management', 'Improv'],
    interests: ['Microsoft Office', 'Excel', 'PowerPoint'],
    bio: 'Regional Manager looking to master spreadsheets and build the ultimate slideshows. I can teach you the art of the sale!'
  },
  {
    name: 'Nancy Drew',
    email: 'nancy@skillswap.com',
    password: 'password123',
    skills: ['Investigation', 'Research', 'Problem Solving'],
    interests: ['Data Analysis', 'Python'],
    bio: 'Private researcher looking to leverage programming tools to automate data searches. Can teach you research tactics.'
  },
  {
    name: 'Oscar Martinez',
    email: 'oscar@skillswap.com',
    password: 'password123',
    skills: ['Accounting', 'Excel', 'Tax Law'],
    interests: ['Spanish Literature', 'Creative Writing'],
    bio: 'Accountant looking to explore creative writing and Spanish literature. I will get your financial books in order!'
  },
  {
    name: 'Peter Parker',
    email: 'peter@skillswap.com',
    password: 'password123',
    skills: ['Photography', 'Physics', 'Web Development'],
    interests: ['Machine Learning', 'Computer Vision'],
    bio: 'Physics student and part-time photographer. I want to build advanced computer vision models to detect objects in photos.'
  }
];

const seedDatabase = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap';
  
  try {
    console.log('Connecting to MongoDB for seeding...');
    await mongoose.connect(mongoURI, { maxPoolSize: 10 });
    console.log('MongoDB Connected.');

    // Clear existing data
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Match.deleteMany({});
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Collections cleared.');

    // Hash passwords and save users
    console.log('Hashing passwords and seeding users...');
    const hashedUsers = await Promise.all(seedUsers.map(async (u) => {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      return {
        ...u,
        password: hashedPassword
      };
    }));

    const users = await User.insertMany(hashedUsers);
    console.log(`Successfully seeded ${users.length} user profiles.`);

    mongoose.connection.close();
    console.log('Seeding completed. Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
