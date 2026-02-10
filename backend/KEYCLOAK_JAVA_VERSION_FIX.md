# Keycloak Java Version Compatibility Fix

## Problem

Keycloak 25.0.0 doesn't support Java 25. The error message indicates:
```
Java 25 (69) is not supported by the current version of Byte Buddy which officially supports Java 22 (66)
```

## Solutions

### Solution 1: Use Java 17, 21, or 22 (Recommended)

Keycloak 25.0.0 officially supports:
- Java 17 (LTS)
- Java 21 (LTS)
- Java 22

#### Install Java 21 (Recommended - LTS)

**Ubuntu/Debian:**
```bash
# Install Java 21
sudo apt update
sudo apt install openjdk-21-jdk

# Set as default
sudo update-alternatives --config java
# Select Java 21

# Verify
java -version
# Should show: openjdk version "21.x.x"
```

**macOS:**
```bash
# Using Homebrew
brew install openjdk@21

# Set JAVA_HOME
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH=$JAVA_HOME/bin:$PATH

# Verify
java -version
```

**Or use SDKMAN (Linux/macOS):**
```bash
# Install SDKMAN
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"

# Install Java 21
sdk install java 21.0.1-tem

# Use Java 21
sdk use java 21.0.1-tem
```

#### Install Java 17 (Alternative - LTS)

**Ubuntu/Debian:**
```bash
sudo apt install openjdk-17-jdk
sudo update-alternatives --config java
```

**macOS:**
```bash
brew install openjdk@17
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
```

#### Verify Java Version

```bash
java -version
# Should show Java 17, 21, or 22
```

Then rebuild Keycloak:
```bash
cd ~/keycloak/keycloak-25.0.0
bin/kc.sh build
```

### Solution 2: Use Experimental Byte Buddy (Workaround)

If you must use Java 25, you can enable experimental Byte Buddy support:

```bash
# Set the experimental property
export JAVA_OPTS="-Dnet.bytebuddy.experimental=true"

# Then build
bin/kc.sh build
```

Or set it inline:
```bash
JAVA_OPTS="-Dnet.bytebuddy.experimental=true" bin/kc.sh build
```

**Note:** This is experimental and may have issues. It's better to use a supported Java version.

### Solution 3: Use Docker (Easiest)

If you have Java 25 and don't want to change it, use Docker instead:

```bash
# Use the provided docker-compose file
docker-compose -f docker-compose.keycloak.yml up -d
```

Docker will use the correct Java version automatically.

## Quick Fix Commands

### Check Current Java Version
```bash
java -version
javac -version
```

### Switch Java Version (if multiple installed)

**Ubuntu/Debian:**
```bash
sudo update-alternatives --config java
sudo update-alternatives --config javac
```

**macOS (with Homebrew):**
```bash
# List installed versions
/usr/libexec/java_home -V

# Set for current session
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
export PATH=$JAVA_HOME/bin:$PATH

# Make permanent (add to ~/.zshrc or ~/.bash_profile)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.zshrc
```

**Using SDKMAN:**
```bash
# List installed
sdk list java

# Install Java 21
sdk install java 21.0.1-tem

# Use it
sdk use java 21.0.1-tem

# Set as default
sdk default java 21.0.1-tem
```

## Recommended Setup

For the best compatibility:

1. **Install Java 21 (LTS)** - Most stable and widely supported
2. **Verify installation:**
   ```bash
   java -version
   # Should show: openjdk version "21.x.x"
   ```
3. **Build Keycloak:**
   ```bash
   cd ~/keycloak/keycloak-25.0.0
   bin/kc.sh build
   ```
4. **Start Keycloak:**
   ```bash
   bin/kc.sh start-dev --http-port=8180
   ```

## Verify Java Version in Keycloak

After building, you can verify which Java version Keycloak is using:

```bash
# Check Keycloak logs
bin/kc.sh start-dev --http-port=8180
# Look for Java version in startup logs
```

## Troubleshooting

### Multiple Java Versions

If you have multiple Java versions installed:

**Linux:**
```bash
# List all Java installations
update-alternatives --list java

# Set default
sudo update-alternatives --config java
```

**macOS:**
```bash
# List all
/usr/libexec/java_home -V

# Set JAVA_HOME for current session
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

### JAVA_HOME Not Set

```bash
# Find Java installation
which java
readlink -f $(which java)

# Set JAVA_HOME (example for Java 21)
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
# Or
export JAVA_HOME=$(/usr/libexec/java_home -v 21)

# Add to PATH
export PATH=$JAVA_HOME/bin:$PATH

# Make permanent (add to ~/.bashrc or ~/.zshrc)
echo 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> ~/.bashrc
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> ~/.bashrc
```

### Still Getting Errors

1. **Clean and rebuild:**
   ```bash
   cd ~/keycloak/keycloak-25.0.0
   rm -rf data/ .quarkus/
   bin/kc.sh build
   ```

2. **Check JAVA_HOME:**
   ```bash
   echo $JAVA_HOME
   # Should point to Java 17, 21, or 22
   ```

3. **Use Docker instead:**
   ```bash
   docker-compose -f docker-compose.keycloak.yml up -d
   ```

## Summary

**Best Solution:** Install Java 21 (LTS) and use it for Keycloak.

**Quick Workaround:** Use Docker which handles Java version automatically.

**Experimental:** Set `-Dnet.bytebuddy.experimental=true` if you must use Java 25 (not recommended).
