const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        const { name, email, rollno, gender, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            rollno,
            gender,
            password: hashedPassword
        });

        await user.save();

        res.status(201).send('User registered successfully');
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).send('Email already exists');
        } else {
            res.status(500).send('An error occurred');
        }
    }
});

module.exports = router;
