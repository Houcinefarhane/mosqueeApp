import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else {
            print("[MadrasApp] scene willConnectTo — pas de UIWindowScene")
            return
        }

        print("[MadrasApp] scene willConnectTo — windows système=\(windowScene.windows.count)")

        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        guard let rootViewController = storyboard.instantiateInitialViewController() else {
            print("[MadrasApp] ERREUR: Main.storyboard sans initialViewController")
            return
        }

        print("[MadrasApp] rootViewController=\(type(of: rootViewController))")

        if let existingWindow = windowScene.windows.first(where: { $0.rootViewController != nil }) {
            window = existingWindow
            print("[MadrasApp] fenêtre storyboard existante réutilisée")
        } else {
            let newWindow = UIWindow(windowScene: windowScene)
            newWindow.rootViewController = rootViewController
            newWindow.makeKeyAndVisible()
            window = newWindow
            print("[MadrasApp] fenêtre créée (windowScene + storyboard Main)")
        }

        if window?.isKeyWindow != true {
            window?.makeKeyAndVisible()
        }

        MadrasWebViewSupport.install()
        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
