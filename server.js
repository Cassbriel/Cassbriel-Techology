require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Serve static files (images, css, js)
app.use(express.static(path.join(__dirname)));

/* ================= DATABASE ================= */
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/cassbriel";
mongoose.connect(mongoURI)
    .then(() => console.log("MongoDB conectado a: " + mongoURI))
    .catch(err => console.log("Error MongoDB:", err));

/* ================= MODELS ================= */

const User = mongoose.model("User", new mongoose.Schema({
    email: { type: String, unique: true },
    password: String
}));

const Config = mongoose.model("Config", new mongoose.Schema({
    key: { type: String, unique: true },
    value: String
}));

const Service = mongoose.model("Service", new mongoose.Schema({
    icon: String,
    title: String,
    description: String,
    order_index: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
}));

const Project = mongoose.model("Project", new mongoose.Schema({
    image_url: String,
    category: String,
    title: String,
    description: String,
    link: String,
    order_index: { type: Number, default: 0 }
}));

const Testimonial = mongoose.model("Testimonial", new mongoose.Schema({
    name: String,
    role: String,
    company: String,
    content: String,
    avatar_url: String,
    order_index: { type: Number, default: 0 }
}));

const FAQ = mongoose.model("FAQ", new mongoose.Schema({
    question: String,
    answer: String,
    order_index: { type: Number, default: 0 }
}));

const Contact = mongoose.model("Contact", new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
}));

/* ================= AUTH MIDDLEWARE ================= */

function auth(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ msg: "No autorizado" });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ msg: "Token inválido" });
    }
}

/* ================= INIT DATA ================= */

async function initData() {
    // Create Admin
    const adminEmail = "admin@cassbriel.com";
    const exists = await User.findOne({ email: adminEmail });
    if (!exists) {
        const hash = await bcrypt.hash("admin123", 10);
        await User.create({ email: adminEmail, password: hash });
        console.log(`Admin creado: ${adminEmail} / admin123`);
    }

    // Initial Config
    const defaultConfig = [
        { key: 'hero_title', value: 'PROTEGIENDO EL FUTURO OPTIMIZANDO EL PRESENTE.' },
        { key: 'hero_slogan', value: 'Especialistas en seguridad electrónica, infraestructura de red y soluciones de hardware a medida. Innovamos para que tu tranquilidad no tenga límites.' },
        { key: 'brands', value: 'HIKVISION, DAHUA, TP-LINK, UBIQUITI, WESTERN DIGITAL, SEAGATE' },
        { key: 'whatsapp', value: '51900000000' },
        { key: 'contact_email', value: 'hectorberrospi@cassbrieltechnology.com' },
        { key: 'logo_url', value: 'logo.png' },
        { key: 'hero_bg_url', value: '' },
        { key: 'logo_text_main', value: 'CASSBRIEL' },
        { key: 'logo_text_accent', value: 'TECH' }
    ];

    for (const c of defaultConfig) {
        const found = await Config.findOne({ key: c.key });
        if (!found) await Config.create(c);
    }
}
initData();

/* ================= AUTH ROUTES ================= */

app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Usuario no existe" });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ msg: "Credenciales inválidas" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "secret");
    res.json({ token, user: { email: user.email } });
});

/* ================= CONFIG ROUTES ================= */

app.get("/api/config", async (req, res) => {
    const config = await Config.find();
    res.json(config);
});

app.post("/api/config", auth, async (req, res) => {
    const { key, value } = req.body;
    await Config.findOneAndUpdate({ key }, { value }, { upsert: true });
    res.json({ msg: "Actualizado" });
});

/* ================= SERVICES CRUD ================= */

app.post("/api/services", auth, async (req, res) => {
    const service = await Service.create(req.body);
    res.json(service);
});

app.get("/api/services", async (req, res) => {
    const services = await Service.find().sort({ order_index: 1 });
    res.json(services);
});

app.put("/api/services/:id", auth, async (req, res) => {
    const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(service);
});

app.delete("/api/services/:id", auth, async (req, res) => {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ msg: "Eliminado" });
});

/* ================= PROJECTS CRUD ================= */

app.post("/api/projects", auth, async (req, res) => {
    const project = await Project.create(req.body);
    res.json(project);
});

app.get("/api/projects", async (req, res) => {
    const projects = await Project.find().sort({ order_index: 1 });
    res.json(projects);
});

app.put("/api/projects/:id", auth, async (req, res) => {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(project);
});

app.delete("/api/projects/:id", auth, async (req, res) => {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: "Eliminado" });
});

/* ================= TESTIMONIALS CRUD ================= */

app.post("/api/testimonials", auth, async (req, res) => {
    const testimonial = await Testimonial.create(req.body);
    res.json(testimonial);
});

app.get("/api/testimonials", async (req, res) => {
    const testimonials = await Testimonial.find().sort({ order_index: 1 });
    res.json(testimonials);
});

app.delete("/api/testimonials/:id", auth, async (req, res) => {
    await Testimonial.findByIdAndDelete(req.params.id);
    res.json({ msg: "Eliminado" });
});

/* ================= FAQ CRUD ================= */

app.post("/api/faq", auth, async (req, res) => {
    const faq = await FAQ.create(req.body);
    res.json(faq);
});

app.get("/api/faq", async (req, res) => {
    const faqs = await FAQ.find().sort({ order_index: 1 });
    res.json(faqs);
});

app.delete("/api/faq/:id", auth, async (req, res) => {
    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ msg: "Eliminado" });
});

/* ================= CONTACT ================= */

app.post("/api/contact", async (req, res) => {
    const contact = await Contact.create(req.body);
    res.json({ msg: "Mensaje enviado" });
});

app.get("/api/contact", auth, async (req, res) => {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
});

/* ================= FRONTEND ================= */

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* ================= ADMIN PANEL ================= */

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Cassbriel Technology 2.0 corriendo en puerto ${PORT}`));
