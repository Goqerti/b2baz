const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const DB_FILE = path.resolve(__dirname, "db.json");

app.use(express.json());
app.use(express.static(__dirname));

// İlkin məlumat strukturu
const initialDB = {
    regions: [
        { id: 1, name: "Baku" },
        { id: 2, name: "Gabala" },
        { id: 3, name: "Ganja" }
    ],
    hotels: [
        {
            id: 1,
            name: "Alba Hotel",
            regionId: 1,
            stars: 4,
            extraBedPricePerNight: 15,
            roomTypes: [
                { id: 1, name: "Standard Double", pricePerNight: 50 },
                { id: 2, name: "Deluxe Double", pricePerNight: 70 }
            ],
            mealPlans: [
                { id: 1, name: "BB", pricePerPersonPerNight: 10 },
                { id: 2, name: "HB", pricePerPersonPerNight: 20 },
                { id: 3, name: "AI", pricePerPersonPerNight: 35 }
            ]
        }
    ],
    operations: [
        { id: 1, name: "Airport → Hotel transfer", price: 25 },
        { id: 2, name: "Hotel → Airport transfer", price: 25 },
        { id: 3, name: "City Tour", price: 35 }
    ],
    reservations: [],
    // Təsdiqlənmiş Agentlər (Login üçün)
    agents: [ 
        { id: 1, username: "agent", password: "password123", name: "Əsas Agent", company: "Default Company", role: "Agent" }
    ],
    // Təsdiq Gözləyən Agentlər (Qeydiyyat üçün)
    pending_agents: [] 
};

// readDB funksiyası xəta idarəetməsi (try/catch) ilə
function readDB() {
    let db = { ...initialDB }; 
    
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
    } else {
        try {
            const fileContent = fs.readFileSync(DB_FILE, "utf8");
            const parsedData = JSON.parse(fileContent);
            
            db = {
                regions: parsedData.regions || [],
                hotels: parsedData.hotels || [],
                operations: parsedData.operations || [],
                reservations: parsedData.reservations || [],
                agents: parsedData.agents || initialDB.agents,
                pending_agents: parsedData.pending_agents || []
            };
            
            // Administrator user-in itməsinin qarşısını alır (id: 2)
            if (!db.agents.find(a => a.username === 'admin')) {
                 db.agents.push({ id: 2, username: "admin", password: "adminpassword", name: "Administrator", company: "System Admin", role: "Admin" });
            }

        } catch (e) {
            console.error("Error reading or parsing DB file. Using initial structure to prevent crash:", e.message);
        }
    }
    return db;
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

app.get("/api/data", (req, res) => {
    res.json(readDB());
});

app.post("/api/regions", (req, res) => {
    const db = readDB();
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ error: "Region name required" });

    const id = db.regions.length ? Math.max(...db.regions.map(r => r.id)) + 1 : 1;
    db.regions.push({ id, name });
    writeDB(db);

    res.json({ regions: db.regions });
});

app.post("/api/operations", (req, res) => {
    const db = readDB();
    const name = req.body.name?.trim();
    const price = Number(req.body.price || 0);
    if (!name) return res.status(400).json({ error: "Operation name required" });

    const id = db.operations.length ? Math.max(...db.operations.map(o => o.id)) + 1 : 1;
    db.operations.push({ id, name, price });
    writeDB(db);

    res.json({ operations: db.operations });
});

app.post("/api/hotels", (req, res) => {
    const db = readDB();
    const { name, regionId, stars, extraBedPricePerNight } = req.body;
    let { roomTypes, mealPlans } = req.body;

    if (!name || !regionId) {
        return res.status(400).json({ error: "Hotel name & region required" });
    }

    const id = db.hotels.length ? Math.max(...db.hotels.map(h => h.id)) + 1 : 1;

    roomTypes = (roomTypes || []).map((rt, i) => ({
        id: i + 1,
        name: rt.name,
        pricePerNight: Number(rt.pricePerNight || 0)
    }));

    mealPlans = (mealPlans || []).map((mp, i) => ({
        id: i + 1,
        name: mp.name,
        pricePerPersonPerNight: Number(mp.pricePerPersonPerNight || 0)
    }));

    db.hotels.push({
        id,
        name,
        regionId: Number(regionId),
        stars: Number(stars),
        extraBedPricePerNight: Number(extraBedPricePerNight || 0),
        roomTypes,
        mealPlans
    });

    writeDB(db);

    res.json({ hotels: db.hotels, regions: db.regions });
});

app.post("/api/reservations", (req, res) => {
    const db = readDB();
    const reservationData = req.body;
    
    if (!reservationData.summary || !reservationData.travelers) {
        return res.status(400).json({ error: "Missing required reservation data" });
    }

    const id = db.reservations.length ? Math.max(...db.reservations.map(r => r.id)) + 1 : 1;
    const date = new Date().toISOString(); 

    db.reservations.push({ id, date, ...reservationData });
    writeDB(db);

    res.json({ message: "Reservation saved successfully", id });
});

// YENİ MARŞRUT: Agent qeydiyyatı
app.post("/api/register", (req, res) => {
    const db = readDB();
    const { firstName, lastName, username, company, password } = req.body;
    
    if (!username || !password || !firstName) {
        return res.status(400).json({ error: "Tələb olunan sahələr boşdur." });
    }
    
    // Agent adının unikal olub olmadığını yoxla
    const isUsernameTaken = db.agents.some(a => a.username === username) || db.pending_agents.some(a => a.username === username);
    if (isUsernameTaken) {
        return res.status(409).json({ error: "Bu istifadəçi adı artıq qeydiyyatdan keçib." });
    }

    const maxId = Math.max(
        ...db.agents.map(a => a.id), 
        ...db.pending_agents.map(a => a.id), 
        0
    );
    const id = maxId + 1;
    
    const newAgent = { 
        id, 
        username, 
        password, 
        name: `${firstName} ${lastName}`, 
        company, 
        role: "Agent", 
        registeredAt: new Date().toISOString()
    };
    
    db.pending_agents.push(newAgent);
    writeDB(db);

    res.json({ success: true, message: "Qeydiyyat uğurlu oldu. Administrator təsdiqini gözləyin." });
});

// YENİ MARŞRUT: Agent Təsdiqlənməsi
app.post("/api/agents/confirm/:id", (req, res) => {
    const db = readDB();
    const agentId = Number(req.params.id);
    
    const agentIndex = db.pending_agents.findIndex(a => a.id === agentId);

    if (agentIndex === -1) {
        return res.status(404).json({ error: "Agent tapılmadı və ya artıq təsdiqlənib." });
    }

    const agentToConfirm = db.pending_agents[agentIndex];
    
    // Təsdiqlənən agenti "agents" massivinə əlavə et
    db.agents.push(agentToConfirm);
    
    // "pending_agents" massivindən sil
    db.pending_agents.splice(agentIndex, 1);
    
    writeDB(db);

    res.json({ success: true, pending_agents: db.pending_agents, agents: db.agents });
});

// YENİ MARŞRUT: Agent Silinməsi (Rədd edilməsi)
app.delete("/api/agents/delete/:id", (req, res) => {
    const db = readDB();
    const agentId = Number(req.params.id);

    // Təsdiq gözləyənlərdən sil
    db.pending_agents = db.pending_agents.filter(a => a.id !== agentId);
    
    // Təsdiqlənmişlərdən sil (ehtiyat üçün)
    db.agents = db.agents.filter(a => a.id !== agentId);

    writeDB(db);

    res.json({ success: true, pending_agents: db.pending_agents, agents: db.agents });
});


// Login API yoxlanışı (yalnız TƏSDİQLƏNMİŞ agentlər üçün)
app.post("/api/login", (req, res) => {
    const db = readDB();
    const { username, password } = req.body;

    // Yalnız təsdiqlənmiş agentlər yoxlanılır
    const agent = db.agents.find(a => a.username === username && a.password === password);
    
    if (agent) {
        res.json({ 
            success: true, 
            name: agent.name, 
            role: agent.role 
        });
    } else {
        // Əgər təsdiq gözləyənlər siyahısındadırsa, xüsusi mesaj ver
        const pending = db.pending_agents.find(a => a.username === username);
        if (pending) {
            return res.status(401).json({ success: false, error: "Qeydiyyatınız təsdiq gözləyir." });
        }
        
        return res.status(401).json({ success: false, error: "İstifadəçi adı və ya şifrə yanlışdır." });
    }
});


app.listen(PORT, () => {
    console.log("SERVER RUNNING → http://localhost:" + PORT);
    console.log("DB FILE → " + DB_FILE);
});