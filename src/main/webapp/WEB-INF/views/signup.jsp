<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Sign Up</title>
    <style>
        body { font-family: system-ui, Arial, sans-serif; margin: 2rem; }
        form { max-width: 420px; }
        label { display:block; margin-top: 1rem; }
        input { width:100%; padding:.6rem; box-sizing: border-box; }
        .error { color:#c00; margin:.5rem 0; }
        button { margin-top:1rem; padding:.6rem 1rem; }
    </style>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' data:;" />
    <!-- Basic form without any third-party JS for simplicity -->
    <!-- NOTE: Passwords are sent to server; ensure HTTPS in production. -->
</head>
<body>
<h1>Sign Up</h1>

<% String error = (String) request.getAttribute("error"); %>
<% if (error != null) { %>
    <div class="error"><%= error %></div>
<% } %>

<form method="post" action="/signup">
    <label>Email
        <input type="email" name="email" value="<%= request.getAttribute("email") != null ? request.getAttribute("email") : "" %>" required />
    </label>
    <label>Name
        <input type="text" name="name" value="<%= request.getAttribute("name") != null ? request.getAttribute("name") : "" %>" />
    </label>
    <label>Password (min 6 chars)
        <input type="password" name="password" minlength="6" required />
    </label>
    <button type="submit">Create account</button>
</form>

</body>
</html>

