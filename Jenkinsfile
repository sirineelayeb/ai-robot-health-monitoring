pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Prepare Environment Files') {
            steps {
                sh '''
                echo "=== Creating backend .env ==="
                cat <<EOF > backend/.env
NODE_ENV=development
HOST=0.0.0.0
PORT=3000

MONGO_URI=mongodb://mongo:27017/robot_db
MQTT_BROKER_URL=mqtt://mqtt:1883
MQTT_TOPIC=robot/telemetry

JWT_SECRET=robot_secret_key_2111
JWT_EXPIRES_IN=1d

ADMIN_EMAIL=admin@robot.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Admin
EOF

                chmod 600 backend/.env

                echo "=== Creating frontend .env ==="
                cat <<EOF > frontend/.env
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=ws://localhost:3000
EOF

                chmod 600 frontend/.env
                '''
            }
        }

        stage('Deploy AI Robot Health Monitoring') {
            steps {
                sh '''
                echo "=== Deploying AI Robot Health Monitoring ==="

                docker-compose down || true

                docker-compose build --no-cache

                docker-compose up -d

                echo "Waiting for services..."
                sleep 15

                echo "Backend → http://localhost:3000"
                echo "Frontend → http://localhost:5173"
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Deployment succeeded!'
        }
        failure {
            echo '❌ Deployment failed!'
        }
    }
}
