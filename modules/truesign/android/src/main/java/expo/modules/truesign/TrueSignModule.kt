package expo.modules.truesign

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.Signature
import android.util.Base64
import java.nio.charset.Charset

class TrueSignModule : Module() {
  // The unique ID for our key inside the hardware chip
  private val KEY_ALIAS = "TrueSign_Hardware_Key_v1"

  override fun definition() = ModuleDefinition {
    // The name we use in JavaScript
    Name("TrueSign")

    // Function 1: Generate or Load the KeyPair
    Function("initializeKeys") {
      try {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)

        // Check if key already exists
        if (!keyStore.containsAlias(KEY_ALIAS)) {
          // Generate a new KeyPair inside the Secure Enclave
          val keyGenerator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            "AndroidKeyStore"
          )
          
          val parameterSpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
          )
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setAlgorithmParameterSpec(java.security.spec.ECGenParameterSpec("secp256r1"))
            .setUserAuthenticationRequired(false) // Set to true if you want Biometric prompt
            .build()

          keyGenerator.initialize(parameterSpec)
          keyGenerator.generateKeyPair()
          return@Function "KEYS_GENERATED"
        }
        return@Function "KEYS_EXIST"
      } catch (e: Exception) {
        throw Exception("Hardware Key Error: " + e.message)
      }
    }

    // Function 2: Sign a String (simulating a photo hash)
    Function("signData") { data: String ->
      try {
        val keyStore = KeyStore.getInstance("AndroidKeyStore")
        keyStore.load(null)

        val entry = keyStore.getEntry(KEY_ALIAS, null) as? KeyStore.PrivateKeyEntry
        if (entry == null) {
          throw Exception("Key not found. Call initializeKeys() first.")
        }

        // Create the signature using the Hardware Key
        val signature = Signature.getInstance("SHA256withECDSA")
        signature.initSign(entry.privateKey)
        signature.update(data.toByteArray(Charset.defaultCharset()))

        val signatureBytes = signature.sign()
        
        // Return as Base64 string so JS can read it
        return@Function Base64.encodeToString(signatureBytes, Base64.NO_WRAP)
      } catch (e: Exception) {
        throw Exception("Signing Failed: " + e.message)
      }
    }
    
    // Function 3: Get Public Key (To verify later)
    Function("getPublicKey") {
       val keyStore = KeyStore.getInstance("AndroidKeyStore")
       keyStore.load(null)
       val cert = keyStore.getCertificate(KEY_ALIAS)
       return@Function Base64.encodeToString(cert.publicKey.encoded, Base64.NO_WRAP)
    }
  }
}

