const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const authtoken = req.headers.authorization;
    if (authtoken) {
        const token = authtoken.split(' ')[1];
        try {
            const decodedPayload = jwt.verify(token, process.env.JWT_SECRET_KEY);
            req.user = decodedPayload;
            next();
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token, access denied' });
        }
    } else {
        return res.status(401).json({ message: 'No token provided, access denied' });
    };
};

function verifyTokenAndAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json({ message: 'Not allowed, only admin' });
        }
    });
};

function verifyTokenAndOnlyUser(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id) {
            next();
        } else {
            return res.status(403).json({ message: 'Not allowed, only user himself' });
        }
    });
};

function verifyTokenAndAuthorization(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.id === req.params.id || req.user.isAdmin) {
            next();
        } else {
            return res.status(403).json({ message: 'Not allowed, only user himself or admin' });
        }
    });
};

module.exports = {
    verifyToken,
    verifyTokenAndAdmin,
    verifyTokenAndOnlyUser,
    verifyTokenAndAuthorization
}