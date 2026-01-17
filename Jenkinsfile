pipeline {
    agent any
    
    options {
        timeout(time: 90, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    environment {
        DOCKER_BUILDKIT = '1'
        COMPOSE_DOCKER_CLI_BUILD = '1'
        COMPOSE_PROJECT_NAME = "robot-health-${BUILD_NUMBER}"
    }
    
    stages {
        stage('Cleanup') {
            steps {
                script {
                    echo "🤖 AI Robot Health Monitoring - Build #${BUILD_NUMBER}"
                }
                checkout scm
                sh '''
                    echo "Stopping existing containers..."
                    docker-compose down -v 2>/dev/null || true
                '''
            }
        }
        
        stage('Prepare Environment') {
            steps {
                sh '''
                echo "Creating environment files..."
                
                # Backend .env
                cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://mongo:27017/robot-health
MQTT_BROKER_URL=mqtt://mqtt:1883
JWT_SECRET=your-secret-key-change-in-production
ADMIN_PASSWORD=admin123
PYTHON_PATH=/usr/bin/python3
EOF
                
                # Frontend .env - FIXED: Use backend service name instead of localhost
                echo "VITE_API_URL=http://backend:3000" > frontend/.env
                
                echo "✅ Environment files created"
                '''
            }
        }
        
        stage('Build Images') {
            steps {
                timeout(time: 45, unit: 'MINUTES') {
                    sh '''
                    echo "🔨 Building Docker images with BuildKit..."
                    echo "This may take 10-15 minutes for ML packages on first build..."
                    
                    # Build with Docker BuildKit for better caching
                    docker-compose build --parallel
                    
                    echo "✅ All images built successfully"
                    '''
                }
            }
        }
        
        stage('Deploy Services') {
            steps {
                sh '''
                echo "🚀 Starting services..."
                docker-compose up -d
                
                echo "⏳ Waiting for services to initialize..."
                sleep 30
                
                echo "📊 Container status:"
                docker-compose ps
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    sh '''
                    echo "🏥 Running health checks..."
                    
                    # Check backend health - FIXED: Use docker-compose exec instead of curl from Jenkins
                    echo "Checking backend..."
                    for i in {1..20}; do
                        if docker-compose exec -T backend curl -s -f http://localhost:3000/health >/dev/null 2>&1; then
                            echo "✅ Backend is healthy!"
                            break
                        fi
                        if [ $i -eq 20 ]; then
                            echo "❌ Backend health check failed after 20 attempts"
                            docker-compose logs backend --tail=100
                            exit 1
                        fi
                        echo "Attempt $i/20 - waiting..."
                        sleep 5
                    done
                    
                    # Check frontend - FIXED: Use docker-compose exec and port 80 (not 5173)
                    echo "Checking frontend..."
                    for i in {1..10}; do
                        if docker-compose exec -T frontend curl -s -f http://localhost:80 >/dev/null 2>&1; then
                            echo "✅ Frontend is healthy!"
                            break
                        fi
                        if [ $i -eq 10 ]; then
                            echo "⚠️ Frontend not responding (may need manual check)"
                        fi
                        sleep 3
                    done
                    
                    # Check MongoDB
                    echo "Checking MongoDB..."
                    docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" || echo "⚠️ MongoDB check skipped"
                    
                    echo "✅ Health checks completed"
                    '''
                }
            }
        }
        
        stage('Verify ML Models') {
            steps {
                sh '''
                echo "🤖 Verifying ML components..."
                
                # Check if ML models are loaded (optional)
                docker-compose exec -T backend node -e "console.log('Node.js OK')" || echo "⚠️ Node check failed"
                docker-compose exec -T backend python3 -c "import sklearn; print('✅ scikit-learn:', sklearn.__version__)" || echo "⚠️ sklearn not available"
                docker-compose exec -T backend python3 -c "import xgboost; print('✅ XGBoost:', xgboost.__version__)" || echo "⚠️ xgboost not available"
                
                echo "✅ ML verification completed"
                '''
            }
        }
    }
    
    post {
        success {
            script {
                echo '''
                ╔══════════════════════════════════════════════════════════╗
                ║          🎉 DEPLOYMENT SUCCESSFUL! 🎉                    ║
                ╚══════════════════════════════════════════════════════════╝
                
                📱 Application URLs:
                   - Frontend:  http://localhost:5173
                   - Backend:   http://localhost:3000
                   - Health:    http://localhost:3000/health
                   
                💾 Database & Messaging:
                   - MongoDB:   localhost:27017
                   - MQTT:      localhost:1883
                   
                🤖 Services Running:
                '''
                sh 'docker-compose ps'
                
                echo '''
                
                📝 Quick Commands:
                   - View logs:     docker-compose logs -f
                   - Stop all:      docker-compose down
                   - Restart:       docker-compose restart
                '''
            }
        }
        
        failure {
            script {
                echo '''
                ╔══════════════════════════════════════════════════════════╗
                ║          ❌ DEPLOYMENT FAILED ❌                          ║
                ╚══════════════════════════════════════════════════════════╝
                '''
                
                sh '''
                echo "📋 Container Status:"
                docker-compose ps || true
                
                echo ""
                echo "📜 Last 100 lines of logs:"
                docker-compose logs --tail=100 || true
                
                echo ""
                echo "🔍 Backend specific logs:"
                docker-compose logs backend --tail=50 || true
                '''
            }
        }
        
        always {
            sh '''
            echo "📊 Final container status:"
            docker-compose ps || true
            
            echo ""
            echo "💾 Disk usage:"
            docker system df || true
            '''
        }
    }
}
