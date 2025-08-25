const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
    context.log('Contact form submission received');

    // Configure SendGrid
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    if (sendGridApiKey) {
        sgMail.setApiKey(sendGridApiKey);
    }

    // Enable CORS
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        return;
    }

    try {
        // Validate request method
        if (req.method !== 'POST') {
            context.res.status = 405;
            context.res.body = { error: 'Method not allowed' };
            return;
        }

        // Validate required fields
        const { email, message } = req.body;
        
        if (!email || !message) {
            context.res.status = 400;
            context.res.body = { 
                error: 'Missing required fields',
                required: ['email', 'message']
            };
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            context.res.status = 400;
            context.res.body = { error: 'Invalid email format' };
            return;
        }

        // Log the contact form data
        context.log('Contact form data:', {
            email: email,
            message: message,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown'
        });

        // Send email using SendGrid
        if (sendGridApiKey) {
            const toEmail = process.env.TO_EMAIL || 'info@pinatek.io';
            const fromEmail = process.env.FROM_EMAIL || 'noreply@pinatek.io';
            
            const emailContent = {
                to: toEmail,
                from: fromEmail,
                subject: 'New Contact Form Submission - pinatek.io',
                text: `
New contact form submission received:

From: ${email}
Timestamp: ${new Date().toISOString()}
User Agent: ${req.headers['user-agent'] || 'Unknown'}

Message:
${message}
                `.trim(),
                html: `
<h3>New Contact Form Submission</h3>
<p><strong>From:</strong> ${email}</p>
<p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
<p><strong>User Agent:</strong> ${req.headers['user-agent'] || 'Unknown'}</p>
<h4>Message:</h4>
<p>${message.replace(/\n/g, '<br>')}</p>
                `.trim()
            };

            try {
                await sgMail.send(emailContent);
                context.log('Email sent successfully via SendGrid');
            } catch (sendGridError) {
                context.log.error('SendGrid error:', sendGridError);
                
                // If SendGrid fails, we'll still return success to the user
                // but log the error for debugging
                if (sendGridError.response) {
                    context.log.error('SendGrid response:', sendGridError.response.body);
                }
            }
        } else {
            context.log.warn('SENDGRID_API_KEY not configured - email not sent');
        }

        context.res.status = 200;
        context.res.body = {
            success: true,
            message: 'Thank you for your message! We will get back to you soon.',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        context.log.error('Error processing contact form:', error);
        
        context.res.status = 500;
        context.res.body = {
            error: 'Internal server error',
            message: 'Please try again later'
        };
    }
};
