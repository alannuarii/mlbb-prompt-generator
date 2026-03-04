pipeline {
    agent any

    environment {
        APP_NAME = "mlbb-prompt-generator"
        IMAGE_NAME = "mlbb-prompt-generator"
        CONTAINER_PORT = "8000"
        HOST_PORT = "8000"
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins handles checkout automatically for Multibranch Pipeline or SCM job
                echo "Checkout code complete."
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo "Building Docker Image: ${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker build -t ${IMAGE_NAME}:${env.BUILD_NUMBER} ."
                    sh "docker tag ${IMAGE_NAME}:${env.BUILD_NUMBER} ${IMAGE_NAME}:latest"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying container using Jenkins Credentials..."
                    
                    // Stop and remove existing container if it exists
                    sh "docker stop ${APP_NAME} || true"
                    sh "docker rm ${APP_NAME} || true"

                    // Use credentials from Jenkins store
                    withCredentials([
                        string(credentialsId: 'GEMINI_API_KEY_FREE', variable: 'FREE_KEY'),
                        string(credentialsId: 'GEMINI_API_KEY_PAID', variable: 'PAID_KEY')
                    ]) {
                        // Run the new container with injected environment variables
                        sh """
                            docker run -d \\
                            --name ${APP_NAME} \\
                            --restart always \\
                            -p ${HOST_PORT}:${CONTAINER_PORT} \\
                            -e GEMINI_API_KEY_FREE=${FREE_KEY} \\
                            -e GEMINI_API_KEY_PAID=${PAID_KEY} \\
                            -e NODE_ENV=production \\
                            ${IMAGE_NAME}:latest
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            // Optional: Clean up workspace if needed
            // cleanWs()
            echo "Pipeline finished."
        }
        success {
            echo "Application successfully deployed!"
        }
        failure {
            echo "Deployment failed. Check the logs."
        }
    }
}
