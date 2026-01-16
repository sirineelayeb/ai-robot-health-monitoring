pipeline {
    agent any
    
    options {
        timeout(time: 30, unit: 'MINUTES')
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
        
        stage('Deploy') {
            steps {
                sh '''
                echo "Deploying..."
                
                # Stop any existing containers
                docker-compose down 2>/dev/null || true
                
                # Build and start
                docker-compose build
                docker-compose up -d
                
                echo "Waiting for services..."
                sleep 20
                '''
            }
        }
        
        stage('Verify') {
            steps {
                sh '''
                echo "Verifying..."
                
                # Check status
                docker-compose ps
                
                # Test backend
                echo "Testing backend..."
                for i in {1..10}; do
                    if curl -s http://localhost:3000 > /dev/null; then
                        echo "✅ Backend is up!"
                        break
                    fi
                    echo "Waiting... ($i/10)"
                    sleep 5
                done
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
