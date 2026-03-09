const errorHandler = (err, req, res, next) => {
    // Log the error for internal tracking
    console.error('\x1b[31m[ERROR]\x1b[0m', err.message);

    // 1. Handle SyntaxError (Malformed JSON)
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: true,
            message: 'El formato de los datos (JSON) es inválido. Por favor, revisa la estructura.'
        });
    }

    // 2. Handle MySQL Errors (Foreign Keys, Constraints)
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
        return res.status(400).json({
            error: true,
            message: 'Referencia inválida: Uno de los IDs proporcionados (Vacante, Sede, etc.) no existe en el sistema.'
        });
    }

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            error: true,
            message: 'Dato duplicado: Ya existe un registro con estos datos únicos (ej. Código de Requisición o Email).'
        });
    }

    if (err.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).json({
            error: true,
            message: 'Dato demasiado largo: Uno de los campos excede el límite de caracteres permitido.'
        });
    }

    // Default status code
    const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

    res.status(statusCode).json({
        error: true,
        message: err.message || 'Error Interno del Servidor',
        // In dev we show stack, in prod we hide it
        stack: process.env.NODE_ENV === 'production' ? '🔒' : err.stack,
    });
};

module.exports = errorHandler;
