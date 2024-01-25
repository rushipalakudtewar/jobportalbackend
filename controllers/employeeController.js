const Employee = require('../models/employeeModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken'); // Make sure to require jwt
const azureBlobService = require('../services/azureBlobService');



exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body.personalDetails;

    // Check if all fields are provided
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(403).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password doesn't match"
      });
    }

    // Check if user already exists
    const existsUser = await Employee.findOne({ 'personalDetails.email': email });
    if (existsUser) {
      return res.status(401).json({
        success: false,
        message: "User already registered"
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee
    const employee = new Employee({
      personalDetails: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phone:null
        // ... other personal details
      },
      // ... other fields
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`
    });

    // Save the employee
    const emp = await employee.save();
    console.log(emp);

    // Return response (excluding sensitive data)
    return res.status(201).json({ 
      success: true, 
      message: 'Employee created', 
      emp
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error during signup' });
  }
};

exports.login = async (req, res) => {
  try {
    // Find employee by email
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find employee by email
    const employee = await Employee.findOne({ 'personalDetails.email': req.body.email });
    if (!employee) {
      return res.status(400).json({
        success: false,
        message: 'Cannot find employee'
      });
    }
    console.log(employee);
    if (!employee.personalDetails.password) {
      return res.status(400).json({
        success: false,
        message: 'Employee password not set'
      });
    }
    // Check password
    if (await bcrypt.compare(req.body.password, employee.personalDetails.password)) {
      // Generate JWT token
      const payload = {
        id: employee._id,
        email: employee.personalDetails.email,
        // Add other necessary fields from employee details
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '2h' // Adjust the duration as per your requirement
      });

      // Set cookie options (adjust as per your requirement)
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        httpOnly: true,
        // secure: true, // Enable this in production
      };

      res.cookie('token', token, options);
      res.status(200).json({
        success: true,
        employee,
        token: token,
        message: 'Logged in successfully'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Password is incorrect'
      });
    }
  } catch (error) {
    console.error(error); // Consider using a more sophisticated logging mechanism
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  } 
}

const isImageFile = (file) => {
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  return imageMimeTypes.includes(file.mimetype);
};

const isDocumentFile = (file) => {
  const documentMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  return documentMimeTypes.includes(file.mimetype);
};

exports.uploadProfile = async (req, res) => {
  try {
    const updateData = req.body; // or any other data you need to update
    const employeeId = req.params.id;
    if (req.file) {
      let blobUrl;

          if (isImageFile(req.file)) {
              blobUrl = await azureBlobService.uploadImage(req.file);
              updateData.image = blobUrl;
          } else {
              return res.status(400).json({ error: 'Unsupported file type' });
          } 
       }
    const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, updateData, { new: true });

    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.uploadResume = async (req, res) => {
  try {
    const updateData = req.body; // or any other data you need to update
    const employeeId = req.params.id;
    if (req.file) {
      if (isDocumentFile(req.file)) {
        blobUrl = await azureBlobService.uploadDoc(req.file);
        updateData.resume = blobUrl;
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        } // Assuming 'profileImageUrl' is the field in Employee model
    }
    const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, updateData, { new: true });

    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// exports.uploadFile = async (req, res) => {
//   try {
//     const updateData = req.body;
//     const employeeId = req.params.id;

//     if (req.file) {
//         let blobUrl;

//         if (isImageFile(req.file)) {
//             blobUrl = await azureBlobService.uploadImage(req.file);
//             updateData.image = blobUrl;
//         } else if (isDocumentFile(req.file)) {
//             blobUrl = await azureBlobService.uploadDoc(req.file);
//             updateData.resume = blobUrl;
//         } else {
//             return res.status(400).json({ error: 'Unsupported file type' });
//         }
//     }

//     const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, updateData, { new: true });
//     res.status(200).json(updatedEmployee);
// } catch (error) {
//     res.status(500).json({ error: error.message });
// }
// };





exports.updateProfileDetails = async (req, res) => {
  try {
      const employeeId = req.params.id; // Assuming ID is passed as a URL parameter
      let updateData = req.body;
      if (updateData.personalDetails && updateData.personalDetails.password === undefined) {
        const currentEmployee = await Employee.findById(employeeId);
        if (!currentEmployee) {
          // Handle case where the employee is not found
          return res.status(404).json({ message: "Employee not found" });
        }
    
        // Set the existing password in the update data
        updateData.personalDetails.password = currentEmployee.personalDetails.password;
      }

      // Check if there's a file to upload
      // if (req.file) {
      //   const blobUrl = await azureBlobService.uploadFile(req.file);
      //   updateData.image = blobUrl; // Assuming 'profileImageUrl' is the field in Employee model
      // }
  
      const updatedEmployee = await Employee.findByIdAndUpdate(employeeId, updateData, { new: true });

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Exclude the password field from the response
    if (updatedEmployee.personalDetails && updatedEmployee.personalDetails.password) {
      updatedEmployee.personalDetails.password = undefined;
    }

    // Return the updated employee data without the password
    res.status(200).json(updatedEmployee);
  } catch (err) {
      res.status(400).json({ message: err.message });
  }
};

exports.getProfileDetailsById = async (req, res) => {
  try {
      const employeeId = req.params.id; // Assuming the ID is passed as a URL parameter
      const employee = await Employee.findById(employeeId);

      if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
      }

      res.json(employee);
  } catch (err) {
      res.status(500).json({ message: err.message });
  }
};