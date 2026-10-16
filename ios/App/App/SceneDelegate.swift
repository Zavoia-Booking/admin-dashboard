import UIKit
import Capacitor
import GoogleSignIn

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        // The keyboard shrinks the web view (Capacitor's `resize: native`), so
        // the native window shows through the keyboard's rounded top corners.
        // Match the app's light surface instead of the default black.
        window?.backgroundColor = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0)
        let bridgeViewController = CAPBridgeViewController()
        bridgeViewController.view.backgroundColor = window?.backgroundColor
        window?.rootViewController = bridgeViewController
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        // Google Sign-In (@capgo/capacitor-social-login) completes through a
        // com.googleusercontent.apps.* URL scheme; let the SDK consume it first.
        for context in URLContexts where GIDSignIn.sharedInstance.handle(context.url) {
            return
        }
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
