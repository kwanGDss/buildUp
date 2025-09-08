<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Sign Up Success</title>
    <style>
        body { font-family: system-ui, Arial, sans-serif; margin: 2rem; }
    </style>
</head>
<body>
<h1>Sign Up Success</h1>
<p>Welcome, <%= ((com.smhrd.buildUp.dto.Member)request.getAttribute("member")).getEmail() %>!</p>
<p>Your account has been created.</p>
<p><a href="/">Go to Home</a></p>
</body>
</html>

