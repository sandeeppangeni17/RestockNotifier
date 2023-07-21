import nodemailer from "nodemailer";

// Function to send email notifications
async function sendEmailNotification(email, productName, variantNames) {
  try {
    // Replace with your email service configuration
    // Set up SMTP for Outlook
    const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secure: false,
        auth: {
        user: 'sandeep.pangeni@outcodesoftware.com', // Your Outlook.com email address
        pass: 'outcode@123',    // Your Outlook.com email password
        },
    });

    // Customize the email content here (subject, body, etc.)
    const mailOptions = {
      from: 'sandeep.pangeni@outcodesoftware.com',
      to: email,
      subject: 'Product Restocked!',
      text: `Dear Customer,

      We are excited to inform you that the product "${productName}" has been restocked with the following variants:

      ${variantNames.map((variantName, index) => `${index + 1}. ${variantName}`).join('\n')}

      Thank you for your interest in our products. Happy shopping!

      Sincerely,
      Your Store Team`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    console.log(`Email notification sent to ${email} for product "${productName}".`);
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

export default sendEmailNotification;

