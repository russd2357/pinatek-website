module.exports = async function (context, req) {
    context.log('Contact form submission received');

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

        // Log the contact form data (in production, you'd send this via email service)
        context.log('Contact form data:', {
            email: email,
            message: message,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown'
        });

        // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
        // For now, we'll just log and return success
        
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
