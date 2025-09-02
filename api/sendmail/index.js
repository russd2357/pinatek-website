const sgMail = require('@sendgrid/mail');

module.exports = async function (context, req) {
    context.log('🚀 Contact form submission received');
    
    // 🔍 DEBUG: Log environment configuration
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const toEmail =  'info@pinatek.io';
    const fromEmail = 'info@pinatek.io';
    
    context.log('🔧 Environment Configuration:', {
        hasApiKey: !!sendGridApiKey,
        apiKeyLength: sendGridApiKey ? sendGridApiKey.length : 0,
        toEmail: toEmail,
        fromEmail: fromEmail
    });

    if (sendGridApiKey) {
        sgMail.setApiKey(sendGridApiKey);
        context.log('✅ SendGrid API key configured');
    } else {
        context.log('❌ SendGrid API key missing');
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

        // 🔍 DEBUG: Log the contact form data
        context.log('📧 Contact form data:', {
            email: email,
            message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'Unknown'
        });

        // 📤 Send email using SendGrid
        if (sendGridApiKey) {
            context.log('🔄 Preparing email content...');
            
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

            // 🔍 DEBUG: Log email configuration
            context.log('📋 Email Configuration:', {
                to: emailContent.to,
                from: emailContent.from,
                subject: emailContent.subject,
                textLength: emailContent.text.length,
                htmlLength: emailContent.html.length
            });

            try {
                context.log('🚀 Sending email via SendGrid...');
                
                // This is where you can set a breakpoint for debugging
                const sendGridResponse = await sgMail.send(emailContent);
                
                // 🔍 DEBUG: Log detailed SendGrid response
                context.log('✅ SendGrid Response:', {
                    statusCode: sendGridResponse[0]?.statusCode,
                    headers: sendGridResponse[0]?.headers,
                    body: sendGridResponse[0]?.body,
                    messageId: sendGridResponse[0]?.headers?.['x-message-id']
                });
                
                context.log('🎉 Email sent successfully via SendGrid');
                
            } catch (sendGridError) {
                context.log.error('❌ SendGrid error occurred:', {
                    message: sendGridError.message,
                    code: sendGridError.code,
                    statusCode: sendGridError.response?.status
                });
                
                // 🔍 DEBUG: Detailed error analysis
                if (sendGridError.response) {
                    context.log.error('📋 SendGrid Error Details:', {
                        status: sendGridError.response.status,
                        statusText: sendGridError.response.statusText,
                        headers: sendGridError.response.headers,
                        data: sendGridError.response.data || sendGridError.response.body
                    });
                }
                
                // Re-throw error for proper error handling
                throw sendGridError;
            }
        } else {
            context.log.warn('⚠️ SENDGRID_API_KEY not configured - email not sent');
        }

        context.res.status = 200;
        context.res.body = {
            success: true,
            message: 'Thank you for your message! We will get back to you soon.',
            timestamp: new Date().toISOString()
        };

        context.log('✅ Function completed successfully');

    } catch (error) {
        context.log.error('💥 Critical error processing contact form:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        context.res.status = 500;
        context.res.body = {
            error: 'Internal server error',
            message: 'Please try again later',
            timestamp: new Date().toISOString()
        };
    }
};
