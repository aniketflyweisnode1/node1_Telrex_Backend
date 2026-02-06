# TODO: Bypass OTP Verification by Default and Send Valid OTP on Failure

## Tasks
- [x] Modify `verifyOtp` function in `src/modules/auth/otp.service.js` to skip OTP check and always verify the user
- [x] Test the changes to ensure login/verification works without valid OTP
- [x] Modify OTP sending functions to return default OTP '123456' when delivery fails
- [x] Test the changes to ensure valid OTP is sent even on delivery failure
