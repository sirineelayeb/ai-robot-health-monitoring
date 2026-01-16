pipeline {
    agent any
    
    stages {
        stage('Deploy AI Robot Monitoring') {
            steps {
                sh '''
                    echo "=== Deploying AI Robot Health Monitoring ==="
                    cd $WORKSPACE
                    
                    echo "1. Stopping existing containers..."
                    docker-compose down || true
                    
                    echo "2. Building new images..."
                    docker-compose build --no-cache
                    
                    echo "3. Starting services..."
                    docker-compose up -d
                    
                    echo "4. Waiting for services to start..."
                    sleep 15
                    
                    echo "5. Health checks..."
                    echo "Frontend: http://localhost:5173"
                    echo "Backend API: http://localhost:3000/api/health"
                    
                    echo "✅ Deployment Complete!"
                '''
            }
        }
    }
    
    post {
        success {
            echo '🎉 Pipeline succeeded!'
        }
        failure {
            echo '❌ Pipeline failed!'
        }
    }
}
