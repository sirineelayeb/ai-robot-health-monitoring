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
                
                echo "⏳ Waiting for services to start..."
                sleep 10
                
                echo "📊 Container status:"
                docker compose ps
                '''
            }
        }
        
        stage('Wait for Services') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    sh '''
                    echo "🔍 Waiting for all services to be ready..."
                    
                    # Wait for MongoDB
                    echo "Checking MongoDB..."
                    for i in {1..30}; do
                        if docker compose exec -T mongo mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1; then
                            echo "✅ MongoDB is ready"
                            break
                        fi
                        echo "⏳ Waiting for MongoDB... ($i/30)"
                        sleep 2
                    done
                    
                    # Wait for MQTT
                    echo "Checking MQTT..."
                    for i in {1..30}; do
                        if docker compose exec -T mqtt mosquitto_sub -t '$$SYS/#' -C 1 -W 2 >/dev/null 2>&1; then
                            echo "✅ MQTT is ready"
                            break
                        fi
                        echo "⏳ Waiting for MQTT... ($i/30)"
                        sleep 2
                    done
                    
                    # Wait for Backend
                    echo "Checking Backend..."
                    for i in {1..60}; do
                        if docker compose logs backend 2>&1 | grep -q "Server running"; then
                            echo "✅ Backend is ready"
                            break
                        fi
                        echo "⏳ Waiting for Backend... ($i/60)"
                        sleep 2
                    done
                    
                    # Check if all containers are still running
                    if [ $(docker compose ps -q | wc -l) -lt 5 ]; then
                        echo "❌ Some containers stopped unexpectedly"
                        docker compose ps
                        exit 1
                    fi
                    
                    echo "✅ All services are ready"
                    '''
                }
            }
        }
        
        stage('Verify') {
            steps {
                sh '''
                echo "🔍 Verifying deployment..."
                
                echo "📊 All containers:"
                docker compose ps
                
                echo ""
                echo "📋 Recent logs from each service:"
                echo "==================================="
                
                echo ""
                echo "Backend logs:"
                docker compose logs backend --tail=20
                
                echo ""
                echo "Frontend logs:"
                docker compose logs frontend --tail=20
                
                echo ""
                echo "Simulator logs:"
                docker compose logs simulator --tail=20
                
                echo ""
                echo "✅ Verification complete"
                '''
            }
        }
    }
    
    post {
        success {
            echo '🎉 DEPLOYMENT SUCCESSFUL!'
            sh '''
                echo ""
                echo "✅ All services are running:"
                docker compose ps
                
                echo ""
                echo "🌐 Access the application at:"
                echo "   Frontend: http://localhost:5173"
                echo "   Backend:  http://localhost:3000"
            '''
        }
        failure {
            echo '❌ DEPLOYMENT FAILED'
            sh '''
                echo ""
                echo "📋 Container status:"
                docker compose ps || true
                
                echo ""
                echo "📜 Full logs from all services:"
                docker compose logs --tail=100 || true
            '''
        }
        always {
            sh 'docker compose ps || true'
        }
    }
}
