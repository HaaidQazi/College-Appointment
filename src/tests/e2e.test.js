const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");
const dotenv = require('dotenv');
dotenv.config();

let professorToken;
let studentAToken;
let studentBToken;
let professorId;
let studentAId;
let studentBId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test1');    
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe("College Appointment System E2E Tests", () => {
  it("should register a professor and two students", async () => {
    const professor = { name: "Professor P1", email: "prof1@example.com", password: "profpassword", role: "Professor" };
    const studentA = { name: "Student A1", email: "studentA1@example.com", password: "studentpassword", role: "Student" };
    const studentB = { name: "Student A2", email: "studentA2@example.com", password: "studentpassword", role: "Student" };

    const resProfessor = await request(app).post("/api/auth/signup").send(professor);
    expect(resProfessor.status).toBe(201);    
    professorId = resProfessor.body._id;

    const resStudentA = await request(app).post("/api/auth/signup").send(studentA);
    expect(resStudentA.status).toBe(201);
    studentAId = resStudentA.body._id;

    const resStudentB = await request(app).post("/api/auth/signup").send(studentB);
    expect(resStudentB.status).toBe(201);
    studentBId = resStudentB.body._id;
  });

  it("should login the professor and students", async () => {
    const professorLogin = { email: "prof1@example.com", password: "profpassword", role: "Professor" };
    const studentALogin = { email: "studentA1@example.com", password: "studentpassword", role: "Student" };
    const studentBLogin = { email: "studentA2@example.com", password: "studentpassword", role: "Student" };

    const resProfessorLogin = await request(app).post("/api/auth/login").send(professorLogin);
    expect(resProfessorLogin.status).toBe(200);
    professorToken = resProfessorLogin.body.token;

    const resStudentALogin = await request(app).post("/api/auth/login").send(studentALogin);
    expect(resStudentALogin.status).toBe(200);
    studentAToken = resStudentALogin.body.token;

    const resStudentBLogin = await request(app).post("/api/auth/login").send(studentBLogin);
    expect(resStudentBLogin.status).toBe(200);
    studentBToken = resStudentBLogin.body.token;
  });

  it("should allow professor to set availability", async () => {
    const availability = {
      professorId,
      date: "2024-12-27",
      slots: [
        { startTime: "2024-12-27T09:00:00.000Z", endTime: "2024-12-27T10:00:00.000Z" },
        { startTime: "2024-12-27T10:00:00.000Z", endTime: "2024-12-27T11:00:00.000Z" }
      ]
    };

    const res = await request(app)
      .post("/api/availability/set-availability")
      .set("Authorization", `Bearer ${professorToken}`)
      .send(availability);

    expect(res.status).toBe(201);
    availabilityId = res.body._id;
  });

  it("should allow Student A to view availability and book appointment", async () => {
    const viewRes = await request(app)
      .post("/api/availability/view-availability")
      .send({ professorId, date: "2024-12-27" });

    expect(viewRes.status).toBe(200);
    const availableSlot = viewRes.body.slots[0];

    const bookingRes = await request(app)
      .post("/api/bookings/book")
      .set("Authorization", `Bearer ${studentAToken}`)
      .send({
        studentId: studentAId,
        professorId,
        date: "2024-12-27",
        startTime: availableSlot.startTime,
      });

    expect(bookingRes.status).toBe(200);
  });

  it("should allow Student B to view availability and book appointment", async () => {
    const viewRes = await request(app)
      .post("/api/availability/view-availability")
      .send({ professorId, date: "2024-12-27" });

    expect(viewRes.status).toBe(200);
    const availableSlot = viewRes.body.slots[1];

    const bookingRes = await request(app)
      .post("/api/bookings/book")
      .set("Authorization", `Bearer ${studentBToken}`)
      .send({
        studentId: studentBId,
        professorId,
        date: "2024-12-27",
        startTime: availableSlot.startTime,
      });

    expect(bookingRes.status).toBe(200);
  });

  it("should allow professor to cancel Student A's appointment", async () => {
    const cancelRes = await request(app)
      .post("/api/bookings/cancel-appointment")
      .set("Authorization", `Bearer ${professorToken}`)
      .send({
        professorId,
        studentId: studentAId,
        date: "2024-12-27",
        startTime: "2024-12-27T09:00:00.000Z",
      });

    expect(cancelRes.status).toBe(200);
  });

  it("should allow Student A to check appointments and realize there are no appointments", async () => {
    const appointmentsRes = await request(app)
      .get("/api/bookings/view-appointments/" + studentAId)
      .set("Authorization", `Bearer ${studentAToken}`);

    expect(appointmentsRes.status).toBe(200);
    expect(appointmentsRes.body.appointments.length).toBe(0);
  });
});
