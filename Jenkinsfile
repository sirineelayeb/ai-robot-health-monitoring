pipeline {
    agent any
    
    options {
        timeout(time: 90, unit: 'MINUTES')
    }
    
    environment {
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
    }
    
    stages {
        stage('Cleanup') {
            steps {
                script {
                    echo "🤖 AI Robot Health Monitoring - Build #${BUILD_NUMBER}"
                }
                checkout scm
                sh 'docker compose down -v 2>/dev/null || true'
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
JWT_SECRET=your-secret-key-change-in-production
ADMIN_PASSWORD=admin123
PYTHON_PATH=/usr/bin/python3
ENVEOF
                
                echo "VITE_API_URL=http://localhost:3000" > frontend/.env
                
                echo "✅ Environment files created"
                '''
            }
        }
        
        stage('Build Images') {
            steps {
                timeout(time: 45, unit: 'MINUTES') {
                    sh '''
                    echo "🔨 Building Docker images..."
                    docker compose build
                    echo "✅ Build complete"
                    '''
                }
            }
        }
        
        stage('Deploy Services') {
            steps {
                sh '''
                echo "🚀 Starting services..."
                docker compose up -d
                
                echo "⏳ Waiting 30 seconds..."
                sleep 30
                
                echo "📊 Container status:"
                docker compose ps
                '''
            }
        }
        
        stage('Verify') {
            steps {
                sh '''
                echo "🔍 Checking services..."
                
                echo "Container logs:"
                docker compose logs --tail=20
                
                echo ""
                echo "All containers:"
                docker compose ps
                '''
            }
        }
    }
    
    post {
        success {
            echo '🎉 DEPLOYMENT SUCCESSFUL!'
            sh 'docker compose ps'
        }
        failure {
            echo '❌ DEPLOYMENT FAILED'
            sh 'docker compose logs --tail=100 || true'
        }
        always {
            sh 'docker compose ps || true'
        }
    }
}
