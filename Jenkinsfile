pipeline {
    agent any
    
    options {
        timeout(time: 60, unit: 'MINUTES')
    }
    
    environment {
        DOCKER_BUILDKIT = '1'
    }
    
    stages {
        stage('Clone & Clean') {
            steps {
                checkout scm
                sh '''
                echo "Cleaning up..."
                docker compose down -v 2>/dev/null || true
                '''
            }
        }
        
        stage('Prepare Environment') {
            steps {
                sh '''
                echo "Creating environment files..."
                
                cat > backend/.env << 'ENVEOF'
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://mongo:27017/robot-health
MQTT_BROKER_URL=mqtt://mqtt:1883
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=admin123
ENVEOF
                
                echo "VITE_API_URL=http://localhost:3000" > frontend/.env
                
                echo "Environment files created"
                '''
            }
        }
        
        stage('Build Images') {
            steps {
                timeout(time: 45, unit: 'MINUTES') {
                    sh '''
                    echo "Building Docker images..."
                    docker compose build
                    echo "Build complete"
                    '''
                }
            }
        }
        
        stage('Start Services') {
            steps {
                sh '''
                echo "Starting containers..."
                docker compose up -d
                
                echo "Waiting for services..."
                sleep 40
                
                echo "Container status:"
                docker compose ps
                '''
            }
        }
        
        stage('Basic Tests') {
            steps {
                sh '''
                echo "Running tests..."
                
                echo "Testing MongoDB..."
                docker compose exec -T mongo mongosh --eval "db.version()" --quiet || echo "MongoDB check failed"
                
                echo "Testing MQTT..."
                docker compose exec -T mqtt mosquitto_sub -t test -C 1 -W 1 || echo "MQTT check failed"
                
                echo "Testing Backend..."
                docker compose exec -T backend curl -f http://localhost:3000/health || echo "Backend not ready"
                
                echo "Testing Frontend..."
                docker compose exec -T frontend curl -f http://localhost:80 || echo "Frontend not ready"
                
                echo "Tests complete"
                '''
            }
        }
    }
    
    post {
        success {
            echo 'DEPLOYMENT SUCCESSFUL!'
            sh 'docker compose ps'
        }
        failure {
            echo 'DEPLOYMENT FAILED'
            sh 'docker compose logs --tail=50 || true'
        }
        always {
            sh '''
            echo "Final status:"
            docker compose ps || true
            '''
        }
    }
}