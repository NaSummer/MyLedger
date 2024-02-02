<?php
session_start();
session_destroy(); // 销毁所有会话数据

header('Content-Type: application/json');
echo json_encode(["success" => true]);
?>
