const pdf = require('html-pdf');

const createPdfBuffer = (htmlContent, res) => {
    pdf.create(htmlContent).toBuffer((err, buffer) => {
        if (err) {
            return res.status(500).json({ error: 'PDF generation failed' });
        }
        res.contentType('application/pdf');
        res.send(buffer);
    });
};

module.exports = { createPdfBuffer };
