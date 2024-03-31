const User = require("../models/User");

exports.updateUserProfile = async (req, res) => {
    try {
      const userId = req.user.userId;
      const { name, lastName, age, email } = req.body;
      const user = await User.findById(userId);
  
      if (!name && !lastName && !age && !email) {
        return (
          res.status(400),
          json({ message: "At least one field is required to update profile" })
        );
      }
  
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (name) user.name = name;
      if (lastName) user.lastName = lastName;
      if (age) user.age = age;
      if (email) user.email = email;
  
      await user.save();
      res.status(200).json({ message: "User profile updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed update user profile" });
    }
  };