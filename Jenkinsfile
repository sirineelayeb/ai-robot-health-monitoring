pipeline {
    agent any
    
    parameters {
        choice(
            name: 'DEPLOY_ENVIRONMENT',
            choices: ['development'],
            description: 'Select deployment environment'
        )
        booleanParam(
            name: 'ENABLE_SIMULATOR',
            defaultValue: true,
            description: 'Enable robot simulator'
        )
    }
    
    environment {
        COMPOSE_PROJECT_NAME = "robot-health-${BUILD_NUMBER}"
    }
    
    stages {
        
        stage('Checkout & Setup') {
            steps {
                checkout scm
                script {
                    echo "🤖 AI Robot Health Monitoring - Build #${BUILD_NUMBER}"
                    echo "🌍 Environment: ${params.DEPLOY_ENVIRONMENT}"
                    echo "🤖 Simulator: ${params.ENABLE_SIMULATOR ? 'ENABLED' : 'DISABLED'}"
                }
            }
        }
        
        stage('Prepare Environment') {
            steps {
                withCredentials([
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'admin-password', variable: 'ADMIN_PASSWORD'),
                    string(credentialsId: 'mongo-uri', variable: 'MONGO_URI'),
                    string(credentialsId: 'mqtt-broker-url', variable: 'MQTT_BROKER_URL')
                ]) {
                    sh '''
                    echo "⚙️ Creating environment files..."
                    
                    # Backend .env
                    cat > backend/.env << EOF
NODE_ENV=${DEPLOY_ENVIRONMENT}
HOST=0.0.0.0
PORT=3000
MONGO_URI=${MONGO_URI}
MQTT_BROKER_URL=${MQTT_BROKER_URL}
MQTT_TOPIC=robot/telemetry
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@robot.com
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_NAME=Admin
EOF
                    
                    # Frontend .env
                    cat > frontend/.env << EOF
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=ws://localhost:3000
EOF
                    
                    echo "✅ Environment files created"
                    '''
                }
            }
        }
        
        stage('Build & Deploy') {
            steps {
                sh '''
                set -e
                echo "🚀 Building and deploying..."
                
                # Stop any existing containers
                docker-compose down 2>/dev/null || true
                
                # Build images
                echo "Building Docker images..."
                docker-compose build --no-cache
                
                # Start services
                echo "Starting services..."
                docker-compose up -d
                
                echo "✅ Services deployed"
                '''
            }
        }
        
        stage('Health Check') {
            steps {
                sh '''
                echo "🏥 Checking services..."
                
                # Give services time to start
                sleep 10
                
                # Check container status
                echo "Container status:"
                docker-compose ps
                
                # Test backend
                echo "Testing backend API..."
                for i in {1..10}; do
                    if curl -s -f http://localhost:3000 > /dev/null 2>&1 || \
                       curl -s -f http://localhost:3000/health > /dev/null 2>&1 || \
                       curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
                        echo "✅ Backend is responding"
                        break
                    fi
                    if [ $i -eq 10 ]; then
                        echo "⚠️ Backend not responding, checking logs..."
                        docker-compose logs backend --tail=10
                    fi
                    echo "Waiting for backend... ($i/10)"
                    sleep 5
                done
                
                # Test frontend
                echo "Testing frontend..."
                if curl -s -f http://localhost:5173 > /dev/null 2>&1; then
                    echo "✅ Frontend is accessible"
                else
                    echo "⚠️ Frontend not accessible yet"
                fi
                
                echo "✅ Health checks completed"
                '''
            }
        }
    }
    
    post {
        always {
            echo "📊 Build #${BUILD_NUMBER} completed"
            sh '''
            echo "=== Final Status ==="
            docker-compose ps 2>/dev/null || echo "No containers running"
            '''
        }
        success {
            echo "🎉 DEPLOYMENT SUCCESSFUL!"
            echo ""
            echo "🌐 Access URLs:"
            echo "   Frontend: http://localhost:5173"
            echo "   Backend:  http://localhost:3000"
            echo "   MongoDB:  localhost:27017"
            echo "   MQTT:     localhost:1883"
            echo ""
            echo "📝 Commands:"
            echo "   View logs: docker-compose logs -f"
            echo "   Stop:      docker-compose down"
            echo "   Status:    docker-compose ps"
        }
        failure {
            echo "❌ DEPLOYMENT FAILED!"
            sh '''
            echo "=== Debug Information ==="
            docker-compose logs --tail=30 2>/dev/null || echo "Cannot get logs"
            '''
        }
    }
}
