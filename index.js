/* eslint-disable no-undef */
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

const app = express();

app.use(express.json());
app.use(cors());
dotenv.config();

const mongourl = process.env.Url;
const port = process.env.port;

const createConnection = async () => {
  const client = new MongoClient(mongourl);
  await client.connect();
  console.log('Mongo connected');
  return client;
};

const client = await createConnection();

app.get('/', (req, res) => {
  res.send('App Is Working Fine');
});

// Create Mentor
app.post('/mentors', async (req, res) => {
  try {
    const mentorData = req.body;
    const mentor = await client
      .db('Guvi')
      .collection('mentors')
      .insertOne(mentorData);
    res.status(201).json(mentor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create mentor' });
  }
});

// Create Student
app.post('/students', async (req, res) => {
  try {
    const studentData = req.body;
    const student = await client
      .db('Guvi')
      .collection('students')
      .insertOne(studentData);
    res.status(201).json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student' });
  }
});

// Assign or Change Mentor for a Student
app.put('/students/:studentId/assign-mentor/:mentorId', async (req, res) => {
  try {
    const { studentId, mentorId } = req.params;
    const student = await client
      .db('Guvi')
      .collection('students')
      .updateOne(
        { _id: ObjectId(studentId) },
        { $set: { mentor: ObjectId(mentorId) } }
      );
    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to assign mentor to student' });
  }
});

// Assign Many Students to Only One Mentor
app.put('/mentors/:mentorId/add-students', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { studentIds } = req.body;
    const mentor = await client
      .db('Guvi')
      .collection('mentors')
      .updateOne(
        { _id: ObjectId(mentorId) },
        { $addToSet: { students: { $each: studentIds.map(ObjectId) } } }
      );
    res.json(mentor);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add students to mentor' });
  }
});

// Get All Students Assigned to a Particular Mentor
app.get('/mentors/:mentorId/students', async (req, res) => {
  try {
    const { mentorId } = req.params;
    const students = await client
      .db('Guvi')
      .collection('students')
      .find({ mentor: ObjectId(mentorId) })
      .toArray();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students for mentor' });
  }
});

// Get All Students Unassigned to a Mentor
app.get('/students/unassigned', async (req, res) => {
  try {
    const students = await client
      .db('Guvi')
      .collection('students')
      .find({ mentor: { $exists: false } })
      .toArray();
    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students without mentor' });
  }
});

app.listen(port, () => console.log('Server started on', port));
