import mongoose from "mongoose";
import bcryptjs from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Course from "./models/Course.js";
import Enrollment from "./models/Enrollment.js";
import Grade from "./models/Grade.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/secdev";

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully!");

    // 1. Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Grade.deleteMany({});
    console.log("Old data cleared.");

    // 2. Hash passwords
    const hashedPassword = await bcryptjs.hash("password123", 10);

    // 3. Create admin user
    const admin = await User.create({
      email: "admin@example.com",
      firstName: "System",
      lastName: "Admin",
      passwordHash: hashedPassword,
      role: "ADMIN",
    });
    console.log("Admin created:", admin._id);

    // 4. Create teacher user
    const teacher = await User.create({
      email: "teacher1@example.com",
      firstName: "John",
      lastName: "Doe",
      passwordHash: hashedPassword,
      role: "TEACHER",
    });
    console.log("Teacher created:", teacher._id);

    // 5. Create student users
    const student1 = await User.create({
      email: "student1@example.com",
      firstName: "Alice",
      lastName: "Smith",
      passwordHash: hashedPassword,
      role: "STUDENT",
    });

    const student2 = await User.create({
      email: "student2@example.com",
      firstName: "Bob",
      lastName: "Johnson",
      passwordHash: hashedPassword,
      role: "STUDENT",
    });
    console.log("Students created:", student1._id, student2._id);

    // 6. Seed courses
    const courses = [
      {
        code: "CS101",
        section: "A",
        title: "Introduction to Programming",
        description: "Learn basic programming concepts.",
        capacity: 40,
        teacher: teacher._id,
        createdBy: admin._id,
      },
      {
        code: "CS202",
        section: "B",
        title: "Data Structures",
        description: "Covers arrays, stacks, trees, graphs, etc.",
        capacity: 40,
        teacher: teacher._id,
        createdBy: admin._id,
      },
    ];

    const createdCourses = await Course.insertMany(courses);
    console.log("Courses seeded successfully!");

    // 7. Enroll students
    await Enrollment.insertMany([
      {
        student: student1._id,
        courseId: createdCourses[0]._id,
        status: "ENROLLED",
      },
      {
        student: student2._id,
        courseId: createdCourses[0]._id,
        status: "ENROLLED",
      },
      {
        student: student1._id,
        courseId: createdCourses[1]._id,
        status: "ENROLLED",
      },
    ]);
    console.log("Enrollments seeded!");

    // 8. Add grades
    await Grade.insertMany([
      {
        studentId: student1._id,
        courseId: createdCourses[0]._id,
        value: "4.0",
        gradedBy: teacher._id,
      },
      {
        studentId: student2._id,
        courseId: createdCourses[0]._id,
        value: "3.5",
        gradedBy: teacher._id,
      },
    ]);
    console.log("Grades seeded!");

    console.log("✅ Database seeding completed successfully!");
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seed();
