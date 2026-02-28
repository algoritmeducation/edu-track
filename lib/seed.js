const bcrypt  = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Group   = require('../models/Group');

const SALT = 10;
let seeded = false;

async function seed() {
  if (seeded) return;
  const count = await Teacher.countDocuments();
  if (count > 0) { seeded = true; return; }
  console.log('Seeding initial data...');
  const teachers = await Teacher.insertMany([
    { name:'Alisher Nazarov',  username:'alisher.n', hash:bcrypt.hashSync('teacher123',SALT), subject:'HTML & CSS'  },
    { name:'Malika Yusupova',  username:'malika.y',  hash:bcrypt.hashSync('teacher123',SALT), subject:'JavaScript'  },
    { name:'Bobur Toshmatov',  username:'bobur.t',   hash:bcrypt.hashSync('teacher123',SALT), subject:'React JS'    },
    { name:'Dilnoza Rahimova', username:'dilnoza.r', hash:bcrypt.hashSync('teacher123',SALT), subject:'Node JS'     },
    { name:'Sardor Mirzayev',  username:'sardor.m',  hash:bcrypt.hashSync('teacher123',SALT), subject:'Full Stack'  },
  ]);
  const [t1,t2,t3,t4,t5] = teachers.map(t => t._id.toString());
  await Group.insertMany([
    { tid:t1, group:'HTML Foundations', lang:'HTML',       time:'09:00', start:'2024-01-15', exam:'2024-03-15', students:18, level:1, doneInLevel:10 },
    { tid:t1, group:'CSS Masters',      lang:'CSS',        time:'11:00', start:'2024-02-01', exam:'2024-04-01', students:22, level:2, doneInLevel:5  },
    { tid:t2, group:'JS Advanced',      lang:'JavaScript', time:'14:00', start:'2024-01-20', exam:'2024-04-20', students:15, level:3, doneInLevel:9  },
    { tid:t2, group:'JS Basics',        lang:'JavaScript', time:'10:00', start:'2024-03-01', exam:'2024-05-20', students:20, level:1, doneInLevel:4  },
    { tid:t3, group:'React Batch 2',    lang:'React JS',   time:'16:00', start:'2024-03-01', exam:'2024-06-01', students:12, level:2, doneInLevel:7  },
    { tid:t3, group:'React Batch 3',    lang:'React JS',   time:'12:00', start:'2024-04-01', exam:'2024-07-01', students:14, level:1, doneInLevel:5  },
    { tid:t4, group:'Node Basics',      lang:'Node JS',    time:'10:00', start:'2024-02-15', exam:'2024-05-15', students:16, level:2, doneInLevel:9  },
    { tid:t4, group:'Node Advanced',    lang:'Node JS',    time:'13:00', start:'2024-03-10', exam:'2024-06-10', students:10, level:1, doneInLevel:8  },
    { tid:t5, group:'Full Stack A',     lang:'React JS',   time:'09:30', start:'2024-02-01', exam:'2024-07-01', students:14, level:3, doneInLevel:4  },
    { tid:t5, group:'Node + React',     lang:'Node JS',    time:'14:30', start:'2024-03-15', exam:'2024-08-01', students:11, level:1, doneInLevel:12 },
  ]);
  seeded = true;
  console.log('Seed complete.');
}

module.exports = seed;