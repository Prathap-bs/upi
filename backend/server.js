const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/admin');
const customerRoutes = require('./routes/customer');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qrpaydb';

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected')).catch(err => console.error(err));

app.use('/api/admin', adminRoutes);
app.use('/api/customer', customerRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'QR Payment backend is running' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
