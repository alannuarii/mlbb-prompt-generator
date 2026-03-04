pipeline {
    agent any

    environment {
        APP_NAME = "mlbb-realistic-prompt"
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
                    echo "Deploying container..."
                    
                    // Stop and remove existing container if it exists
                    sh "docker stop ${APP_NAME} || true"
                    sh "docker rm ${APP_NAME} || true"

                    // Run the new container
                    // Note: --env-file .env is used if the .env exists in the workspace
                    sh """
                        docker run -d \\
                        --name ${APP_NAME} \\
                        --restart always \\
                        -p ${HOST_PORT}:${CONTAINER_PORT} \\
                        --env-file .env \\
                        ${IMAGE_NAME}:latest
                    """
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
