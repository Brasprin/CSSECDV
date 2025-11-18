// seed.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Course from "./models/Course.js";
import AuditLog from "./models/AuditLog.js";
import { connectDB } from "./config/db.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  try {
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await AuditLog.deleteMany({});

    // Create users
    const adminPassword = await bcrypt.hash("Admin123!", 10);
    const teacherPassword = await bcrypt.hash("Teacher123!", 10);
    const studentPassword = await bcrypt.hash("Student123!", 10);

    const admin = await User.create({
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      passwordHash: adminPassword,
      role: "ADMIN",
    });

    const teacher = await User.create({
      email: "teacher@example.com",
      firstName: "Jane",
      lastName: "Teacher",
      passwordHash: teacherPassword,
      role: "TEACHER",
    });

    const student = await User.create({
      email: "student@example.com",
      firstName: "John",
      lastName: "Student",
      passwordHash: studentPassword,
      role: "STUDENT",
    });

    // Create courses
    const course1 = await Course.create({
      name: "Intro to Programming",
      courseId: "CS101",
      teacher: teacher._id,
    });

    const course2 = await Course.create({
      name: "Data Structures",
      courseId: "CS102",
      teacher: teacher._id,
    });

    // Enroll student in course1
    course1.students = [student._id];
    await course1.save();

    // Create sample audit logs
    await AuditLog.create([
      {
        actorId: admin._id,
        actorRole: "ADMIN",
        action: "INITIAL_SEED",
        entity: "USER",
        entityId: student._id,
        metadata: { info: "Seeded student user" },
      },
      {
        actorId: teacher._id,
        actorRole: "TEACHER",
        action: "INITIAL_SEED",
        entity: "COURSE",
        entityId: course1._id,
        metadata: { info: "Seeded course" },
      },
    ]);

    console.log("✅ Database seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
};

seed();
