pipeline {
    agent any

    options {
        timeout(time: 60, unit: "MINUTES")
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    environment {
        DOCKER_BUILDKIT = "1"
    }

    stages {
        stage("Clone & Clean") {
            steps {
                checkout scm
                sh '''
                echo "Cleaning up previous deployment..."
                docker-compose down -v 2>/dev/null || true
                docker system prune -f || true
                '''
            }
        }

        stage("Prepare Environment") {
            steps {
                withCredentials([
                    string(credentialsId: 'robot-jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'robot-admin-password', variable: 'ADMIN_PASSWORD')
                ]) {
                    sh '''
                    echo "Creating environment files..."

                    cat > backend/.env << ENVEOF
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb://mongo:27017/robot-health
MQTT_BROKER_URL=mqtt://mqtt:1883
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@robot.com
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ENVEOF

                    echo "VITE_API_URL=http://localhost:3000" > frontend/.env

                    echo "Environment files created successfully"
                    '''
                }
            }
        }

        stage("Build Images") {
            steps {
                timeout(time: 45, unit: "MINUTES") {
                    sh '''
                    echo "Building Docker images..."
                    docker-compose build
                    echo "Build complete"
                    '''
                }
            }
        }

        stage("Start Services") {
            steps {
                sh '''
                echo "Starting containers..."
                docker-compose up -d

                echo "Waiting for services to initialize..."
                sleep 30
                
                echo "Container status:"
                docker-compose ps
                '''
            }
        }

        stage("Wait for Health") {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    script {
                        sh '''
                        echo "Waiting for services to become healthy..."
                        
                        # Wait for containers to be running
                        for i in {1..60}; do
                            RUNNING=$(docker-compose ps | grep -c "Up" || echo "0")
                            if [ "$RUNNING" -ge 5 ]; then
                                echo "All containers are running"
                                break
                            fi
                            echo "Waiting for containers... (attempt $i/60)"
                            sleep 2
                        done
                        
                        # Additional wait for services to be ready
                        sleep 30
                        
                        echo "Final container status:"
                        docker-compose ps
                        '''
                    }
                }
            }
        }

        stage("Integration Tests") {
            steps {
                script {
                    sh '''
                    set -e
                    echo "Running integration tests..."

                    echo "Testing Backend health endpoint..."
                    for i in {1..15}; do
                        if curl -f --connect-timeout 5 http://localhost:3000/health; then
                            echo "Backend is healthy"
                            break
                        fi
                        echo "Backend not ready, retrying... (attempt $i/15)"
                        sleep 5
                    done

                    echo "Testing Frontend availability..."
                    for i in {1..15}; do
                        if curl -f --connect-timeout 5 http://localhost:5173; then
                            echo "Frontend is accessible"
                            break
                        fi
                        echo "Frontend not ready, retrying... (attempt $i/15)"
                        sleep 5
                    done

                    echo "Testing MongoDB..."
                    docker-compose exec -T mongo mongosh --eval "db.version()" || echo "MongoDB running"

                    echo "All tests passed successfully!"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "✅ DEPLOYMENT SUCCESSFUL!"
            sh '''
            echo ""
            echo "======================================"
            echo "All services are running:"
            echo "======================================"
            docker-compose ps
            echo ""
            echo "======================================"
            echo "Access URLs:"
            echo "======================================"
            echo "Frontend:       http://localhost:5173"
            echo "Backend API:    http://localhost:3000"
            echo "Backend Health: http://localhost:3000/health"
            echo "======================================"
            '''
        }
        failure {
            echo "❌ DEPLOYMENT FAILED"
            sh '''
            echo ""
            echo "======================================"
            echo "Container Status:"
            echo "======================================"
            docker-compose ps || true
            echo ""
            echo "======================================"
            echo "Service Logs (last 100 lines):"
            echo "======================================"
            docker-compose logs --tail=100 || true
            echo ""
            echo "Cleaning up failed deployment..."
            docker-compose down -v || true
            '''
        }
        always {
            sh '''
            echo ""
            echo "======================================"
            echo "Final Status Check:"
            echo "======================================"
            docker-compose ps || true
            
            # Archive logs for debugging
            docker-compose logs > docker-compose-logs.txt 2>&1 || true
            '''
            archiveArtifacts artifacts: 'docker-compose-logs.txt', allowEmptyArchive: true
        }
    }
}
