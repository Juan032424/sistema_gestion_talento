const jwt = require('jsonwebtoken');

const authenticateCandidate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'candidate') {
            return res.status(403).json({ error: 'Tipo de usuario inválido' });
        }

        req.candidateId = decoded.id;
        req.candidateEmail = decoded.email;
        req.candidateSystem = decoded.system || 'legacy';
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
};

module.exports = authenticateCandidate;
