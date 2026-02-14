<?php
session_start();

/* ================= CONFIG ================= */
// Nota: Ajusta estas credenciales según tu entorno (XAMPP usa root/sin clave por defecto)
$host = "localhost";
$user = "root";
$pass = "";
$db   = "cassbriel_erp";

// Intentar conectar y crear la DB si no existe (opcional pero útil)
$conn = new mysqli($host, $user, $pass);
if (!$conn->connect_error) {
    $conn->query("CREATE DATABASE IF NOT EXISTS $db");
    $conn->select_db($db);
} else {
    // Si falla la conexión inicial, intentamos directo a la DB por si ya existe el permiso
    $conn = new mysqli($host, $user, $pass, $db);
}

if($conn->connect_error) die("Error de Conexión: " . $conn->connect_error);

/* ================= CREATE TABLES AUTO ================= */
$conn->query("CREATE TABLE IF NOT EXISTS users(
id INT AUTO_INCREMENT PRIMARY KEY,
name VARCHAR(100),
email VARCHAR(100) UNIQUE,
password VARCHAR(255),
role VARCHAR(50),
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS incomes(
id INT AUTO_INCREMENT PRIMARY KEY,
concept VARCHAR(255),
amount DECIMAL(10,2),
date DATE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

$conn->query("CREATE TABLE IF NOT EXISTS expenses(
id INT AUTO_INCREMENT PRIMARY KEY,
concept VARCHAR(255),
amount DECIMAL(10,2),
date DATE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");

/* ================= CREATE DEFAULT ADMIN ================= */
$check = $conn->query("SELECT * FROM users WHERE email='admin@cassbriel.com'");
if($check && $check->num_rows == 0){
    $passHash = password_hash("admin123", PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users(name,email,password,role)
    VALUES('Super Admin','admin@cassbriel.com','$passHash','superadmin')");
}

/* ================= LOGIN ================= */
$error = "";
if(isset($_POST['login'])){
    $email = $conn->real_escape_string($_POST['email']);
    $password = $_POST['password'];

    $res = $conn->query("SELECT * FROM users WHERE email='$email'");
    if($res && $res->num_rows > 0){
        $user = $res->fetch_assoc();
        if(password_verify($password,$user['password'])){
            $_SESSION['user']=$user;
            header("Location: panel.php");
            exit;
        } else {
            $error = "Contraseña incorrecta";
        }
    } else {
        $error = "Usuario no encontrado";
    }
}

/* ================= LOGOUT ================= */
if(isset($_GET['logout'])){
    session_destroy();
    header("Location: panel.php");
    exit;
}

/* ================= ADD USER ================= */
if(isset($_POST['addUser']) && isset($_SESSION['user'])){
    $name=$conn->real_escape_string($_POST['name']);
    $email=$conn->real_escape_string($_POST['email']);
    $role=$conn->real_escape_string($_POST['role']);
    $password=password_hash($_POST['password'],PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users(name,email,password,role)
    VALUES('$name','$email','$password','$role')");
}

/* ================= ADD INCOME ================= */
if(isset($_POST['addIncome']) && isset($_SESSION['user'])){
    $concept=$conn->real_escape_string($_POST['concept']);
    $amount=$_POST['amount'];
    $date=$_POST['date'];
    $conn->query("INSERT INTO incomes(concept,amount,date)
    VALUES('$concept','$amount','$date')");
}

/* ================= ADD EXPENSE ================= */
if(isset($_POST['addExpense']) && isset($_SESSION['user'])){
    $concept=$conn->real_escape_string($_POST['concept']);
    $amount=$_POST['amount'];
    $date=$_POST['date'];
    $conn->query("INSERT INTO expenses(concept,amount,date)
    VALUES('$concept','$amount','$date')");
}

/* ================= DAILY SUMMARY ================= */
$today = date("Y-m-d");
$incomeToday = 0;
$expenseToday = 0;

$resInc = $conn->query("SELECT SUM(amount) as total FROM incomes WHERE date='$today'");
if($resInc) $incomeToday = $resInc->fetch_assoc()['total'] ?? 0;

$resExp = $conn->query("SELECT SUM(amount) as total FROM expenses WHERE date='$today'");
if($resExp) $expenseToday = $resExp->fetch_assoc()['total'] ?? 0;

$balanceToday = $incomeToday - $expenseToday;

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cassbriel ERP | Gestión Premium</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Syncopate:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        :root {
            --primary: #00a8ff;
            --primary-glow: rgba(0, 168, 255, 0.4);
            --accent-green: #32ff7e;
            --accent-red: #ff4757;
            --bg-dark: #06090f;
            --bg-surface: #0d1117;
            --bg-card: #161b22;
            --glass-border: rgba(255, 255, 255, 0.1);
            --text-main: #f0f6fc;
            --text-muted: #8b949e;
            --transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', sans-serif;
            background: var(--bg-dark);
            color: var(--text-main);
            line-height: 1.6;
            min-height: 100vh;
        }

        /* --- Login Styles --- */
        .login-page {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: radial-gradient(circle at center, #1a1b26 0%, #06090f 100%);
        }
        .login-card {
            background: var(--bg-card);
            padding: 40px;
            border-radius: 24px;
            border: 1px solid var(--glass-border);
            width: 100%;
            max-width: 400px;
            box-shadow: 0 40px 100px rgba(0,0,0,0.5);
            text-align: center;
        }
        .logo-box { font-family: 'Syncopate', sans-serif; font-size: 1.5rem; margin-bottom: 30px; letter-spacing: 2px; }
        .logo-box span { color: var(--primary); }

        /* --- Layout --- */
        .sidebar {
            width: 260px;
            height: 100vh;
            background: var(--bg-surface);
            border-right: 1px solid var(--glass-border);
            position: fixed;
            padding: 40px 20px;
            z-index: 100;
            transition: var(--transition);
        }
        .sidebar h3 { font-family: 'Syncopate', sans-serif; font-size: 1.1rem; margin-bottom: 40px; color: var(--primary); }
        .sidebar a {
            display: flex;
            align-items: center;
            gap: 12px;
            color: var(--text-muted);
            padding: 14px 20px;
            text-decoration: none;
            border-radius: 12px;
            transition: var(--transition);
            margin-bottom: 8px;
            font-weight: 500;
        }
        .sidebar a:hover, .sidebar a.active { background: rgba(0, 168, 255, 0.1); color: var(--primary); }
        .sidebar a.logout { color: var(--accent-red); margin-top: 40px; }

        .content { margin-left: 260px; padding: 40px; transition: var(--transition); }

        /* --- Components --- */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card {
            background: var(--bg-card);
            padding: 24px;
            border-radius: 20px;
            border: 1px solid var(--glass-border);
            position: relative;
            overflow: hidden;
        }
        .stat-card h4 { color: var(--text-muted); font-size: 0.9rem; text-transform: uppercase; margin-bottom: 10px; }
        .stat-card .amount { font-size: 1.8rem; font-weight: 800; }
        .stat-card.inc .amount { color: var(--accent-green); }
        .stat-card.exp .amount { color: var(--accent-red); }
        .stat-card.bal .amount { color: var(--primary); }

        .form-card {
            background: var(--bg-card);
            padding: 30px;
            border-radius: 24px;
            border: 1px solid var(--glass-border);
            margin-bottom: 30px;
        }
        .form-card h3 { margin-bottom: 20px; font-size: 1.2rem; display: flex; align-items: center; gap: 10px; }

        input, select {
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid var(--glass-border);
            border-radius: 12px;
            padding: 12px 16px;
            color: white;
            margin-bottom: 15px;
            font-family: inherit;
        }
        button {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, var(--primary), var(--secondary-blue, #0056b3));
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 700;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: var(--transition);
        }
        button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }

        /* --- Responsive --- */
        @media (max-width: 992px) {
            .sidebar { transform: translateX(-100%); width: 0; padding: 0; }
            .content { margin-left: 0; padding: 20px; }
            .sidebar.active { transform: translateX(0); width: 260px; padding: 40px 20px; }
        }
    </style>
</head>
<body>

<?php if(!isset($_SESSION['user'])): ?>
    <div class="login-page">
        <div class="login-card">
            <div class="logo-box">CASSBRIEL <span>ERP</span></div>
            <h2 style="margin-bottom: 20px;">Acceso al Sistema</h2>
            <?php if($error): ?>
                <p style="color:var(--accent-red); margin-bottom:15px; font-size:0.9rem;"><?php echo $error; ?></p>
            <?php endif; ?>
            <form method="POST">
                <input name="email" type="email" placeholder="Email (admin@cassbriel.com)" required>
                <input name="password" type="password" placeholder="Contraseña (admin123)" required>
                <button name="login">Iniciar Sesión</button>
            </form>
        </div>
    </div>
<?php else: ?>

    <div class="sidebar" id="sidebar">
        <h3>CASSBRIEL ERP</h3>
        <a href="#" class="active"><i class="fas fa-th-large"></i> Dashboard</a>
        <a href="#"><i class="fas fa-users"></i> Usuarios</a>
        <a href="#"><i class="fas fa-wallet"></i> Ingresos</a>
        <a href="#"><i class="fas fa-calculator"></i> Egresos</a>
        <a href="?logout=true" class="logout"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión</a>
    </div>

    <div class="content">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <h2>Hola, <?php echo $_SESSION['user']['name']; ?> 👋</h2>
            <div style="font-size: 0.9rem; color: var(--text-muted);"><?php echo date("l, d M Y"); ?></div>
        </div>

        <div class="stats-grid">
            <div class="stat-card inc">
                <h4>Ingresos Hoy</h4>
                <div class="amount">S/ <?php echo number_format($incomeToday, 2); ?></div>
            </div>
            <div class="stat-card exp">
                <h4>Egresos Hoy</h4>
                <div class="amount">S/ <?php echo number_format($expenseToday, 2); ?></div>
            </div>
            <div class="stat-card bal">
                <h4>Balance Diario</h4>
                <div class="amount">S/ <?php echo number_format($balanceToday, 2); ?></div>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px;">
            <!-- Register Income -->
            <div class="form-card">
                <h3><i class="fas fa-plus-circle" style="color: var(--accent-green);"></i> Nuevo Ingreso</h3>
                <form method="POST">
                    <input name="concept" placeholder="Concepto (ej. Pago de Cliente)" required>
                    <input name="amount" type="number" step="0.01" placeholder="Monto S/" required>
                    <input name="date" type="date" value="<?php echo date('Y-m-d'); ?>" required>
                    <button name="addIncome">Registrar Ingreso</button>
                </form>
            </div>

            <!-- Register Expense -->
            <div class="form-card">
                <h3><i class="fas fa-minus-circle" style="color: var(--accent-red);"></i> Nuevo Egreso</h3>
                <form method="POST">
                    <input name="concept" placeholder="Concepto (ej. Pago a Proveedor)" required>
                    <input name="amount" type="number" step="0.01" placeholder="Monto S/" required>
                    <input name="date" type="date" value="<?php echo date('Y-m-d'); ?>" required>
                    <button name="addExpense" style="background: linear-gradient(135deg, var(--accent-red), #b91c1c);">Registrar Egreso</button>
                </form>
            </div>
        </div>

        <!-- Add User (Only for SuperAdmin) -->
        <?php if($_SESSION['user']['role'] == 'superadmin'): ?>
        <div class="form-card" style="max-width: 500px;">
            <h3><i class="fas fa-user-plus" style="color: var(--primary);"></i> Gestión de Usuarios</h3>
            <form method="POST">
                <input name="name" placeholder="Nombre Completo" required>
                <input name="email" type="email" placeholder="Correo Electrónico" required>
                <input name="password" type="password" placeholder="Contraseña Temporal" required>
                <select name="role">
                    <option value="admin">Administrador</option>
                    <option value="editor">Editor / Contador</option>
                </select>
                <button name="addUser">Crear Usuario</button>
            </form>
        </div>
        <?php endif; ?>
    </div>

    <!-- Toggle Sidebar Mobile -->
    <div style="position: fixed; bottom: 20px; right: 20px; background: var(--primary); width: 50px; height: 50px; border-radius: 50%; display: none; align-items: center; justify-content: center; z-index: 1000;" id="mobileToggle" onclick="document.getElementById('sidebar').classList.toggle('active')">
        <i class="fas fa-bars"></i>
    </div>

    <script>
        // Simple logic for mobile toggle
        if(window.innerWidth < 992) {
            document.getElementById('mobileToggle').style.display = 'flex';
        }
    </script>

<?php endif; ?>

</body>
</html>
