const cors = require("cors");
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const port = 3000; // Ganti dengan port yang Anda inginkan
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authenticateToken = require('./middlewares/auth.middleware.js')
mongoose.connect('mongodb://127.0.0.1/test', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const Schema = mongoose.Schema;
const hospitalSchema = new Schema({
  name: String,
  handphone: String,
  birthdate: Date,
  address: String
});
const loginSchema = new Schema({
  username: String,
  password: String
});

const userSchema = new Schema({
  email: String,
  username: String,
  password: String
});

const hospitalModel = mongoose.model('Hospital', hospitalSchema);
const loginModel = mongoose.model('Login', loginSchema);
const User = mongoose.model('User', userSchema);

let products = ['tt','ii'];


function generateAccessToken(payload) {
    return jwt.sign(payload, 'rahasia', { expiresIn: '1800s' });
}



// Menggunakan middleware bodyParser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({origin:"*"}));

app.post('/auth/register', async (req, res) => {
  let requestBody = req.body;
  requestBody.password = bcrypt.hashSync(requestBody.password, 10)
  const user = new User(requestBody)
  user.save()
  return res.json(user)
});


app.post("/auth/login", async function(req, res) {
  let {username} = req.body
  let preload = {}
  preload.username = username


  try {
      let user = await User.findOne({username})
      preload.id = user._id
      let isValid = await bcrypt.compare(req.body.password, user.password);
      if (isValid) {
          let token = generateAccessToken(preload)
          return res.status(200).json({
              status: 200,
              token
          })
      }

      return res.status(200).json({
        status: 400,
        message:'bad request'
    })
      
      
  } catch (err) {
      res.status(400).json({
          error: err.message
      })
  }

})

app.get('/hospital', authenticateToken, async (req, res) => {
  const hospital = await hospitalModel.find();
  res.json(hospital);
});

app.get('/hospital/:handphone', async (req, res) => {
  const handphone = req.params.handphone;
  const hospital = await hospitalModel.find({ _id: handphone });
  if (hospital) {
    console.log(hospital)
    res.json(hospital);
  } else {
    res.status(404).json({ error: 'Patient Does not Exit!' });
  }
});

app.post('/hospital', async (req, res) => {
  const newhospital = new hospitalModel(req.body);
  await newhospital.save();
  res.json(newhospital);
});

// Update data by Handphone
app.put('/hospital/:handphone', async (req, res) => {
  const { handphone } = req.params;
  const newhospital = req.body;

  try {
    const updatedData = await hospitalModel.findOneAndUpdate({ _id:handphone }, newhospital);
    res.json(updatedData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'There is Error Where Update Data' });
  }
});

app.delete('/hospital/:id', async (req, res) => {
  const { id } = req.params;
  console.log(id)
  try {
    await hospitalModel.findOneAndDelete({ _id: id });
    res.json({ message: 'Delete Success' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'There is Error Where Delete Data' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const newLogin = new loginModel({ username, password });

  try {
    const savedLogin = await newLogin.save();
    res.json(savedLogin);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'There is Error Where Save Log In Data' });
  }
});

function generateId() {
  const timestamp = Date.now().toString(); // Mendapatkan timestamp saat ini
  const randomNum = Math.floor(Math.random() * 1000).toString(); // Mendapatkan angka acak antara 0-999
  const uniqueId = timestamp + randomNum; // Menggabungkan timestamp dan angka acak
  return uniqueId;
}

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
