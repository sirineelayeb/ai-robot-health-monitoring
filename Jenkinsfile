pipeline {
    agent any
    
    options {
        timeout(time: 60, unit: 'MINUTES')
    }
    
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
        COMPOSE_PROJECT_NAME = "robot-${BUILD_NUMBER}"
    }
    
    stages {
        stage('Cleanup') {
            steps {
                checkout scm
                script {
                    echo "🤖 AI Robot Health Monitoring - Build #${BUILD_NUMBER}"
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
                    echo "Creating environment files..."
                    
                    # Backend .env
                    cat > backend/.env << EOF
NODE_ENV=development
PORT=3000
MONGO_URI=${MONGO_URI}
MQTT_BROKER_URL=${MQTT_BROKER_URL}
JWT_SECRET=${JWT_SECRET}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF
                    
                    # Frontend .env
                    echo "VITE_API_URL=http://localhost:3000" > frontend/.env
                    '''
                }
            }
        }
        
        stage('Build') {
            steps {
                sh '''
                echo "Building Docker images..."
                
                # Build backend
                echo "1. Building backend..."
                docker build -t ai-robot-health-monitoring_backend backend/
                
                # Build frontend
                echo "2. Building frontend..."
                docker build -t ai-robot-health-monitoring_frontend frontend/
                
                # Build simulator if enabled
                if [ "$ENABLE_SIMULATOR" = "true" ]; then
                    echo "3. Building simulator..."
                    docker build -t ai-robot-health-monitoring_simulator .
                fi
                
                echo "✅ All images built successfully!"
                '''
            }
        }
        
        stage('Deploy') {
            steps {
                sh '''
                echo "Deploying services..."
                docker-compose up -d
                echo "Waiting for services to start..."
                sleep 15
                '''
            }
        }
        
        stage('Verify') {
            steps {
                sh '''
                echo "Verifying deployment..."
                docker ps
                
                echo "Testing backend..."
                for i in {1..10}; do
                    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
                        echo "✅ Backend is up!"
                        exit 0
                    fi
                    echo "Waiting for backend... ($i/10)"
                    sleep 5
                done
                echo "❌ Backend failed to start"
                exit 1
                '''
            }
        }
    }
    
    post {
        success {
            echo "🎉 Success!"
            echo "Frontend: http://localhost:5173"
            echo "Backend: http://localhost:3000"
        }
        failure {
            echo "❌ Failed"
            sh 'docker-compose logs --tail=20 2>/dev/null || true'
        }
    }
}
