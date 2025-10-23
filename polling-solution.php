<?php
// polling-solution.php - Für Strato Hosting Basic
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

$roomId = $_GET['room'] ?? $_POST['room'] ?? null;
$action = $_GET['action'] ?? $_POST['action'] ?? null;

if (!$roomId) {
    http_response_code(400);
    echo json_encode(['error' => 'Room ID required']);
    exit;
}

$roomFile = "rooms/room_$roomId.json";

switch ($action) {
    case 'get':
        if (file_exists($roomFile)) {
            $data = json_decode(file_get_contents($roomFile), true);
            echo json_encode($data);
        } else {
            echo json_encode(['error' => 'Room not found']);
        }
        break;
        
    case 'update':
        $data = json_decode(file_get_contents('php://input'), true);
        $data['lastUpdate'] = time();
        
        if (!is_dir('rooms')) {
            mkdir('rooms', 0777, true);
        }
        
        file_put_contents($roomFile, json_encode($data));
        echo json_encode(['success' => true]);
        break;
        
    case 'list':
        $rooms = [];
        if (is_dir('rooms')) {
            $files = glob('rooms/room_*.json');
            foreach ($files as $file) {
                $data = json_decode(file_get_contents($file), true);
                if ($data && (time() - $data['lastUpdate']) < 3600) { // 1 hour
                    $rooms[] = [
                        'id' => basename($file, '.json'),
                        'active' => $data['gameActive'] ?? false,
                        'lastUpdate' => $data['lastUpdate']
                    ];
                }
            }
        }
        echo json_encode($rooms);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
}
?>
