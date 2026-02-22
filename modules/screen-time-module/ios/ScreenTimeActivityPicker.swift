import SwiftUI
import FamilyControls

@available(iOS 16.0, *)
struct ScreenTimeActivityPicker: View {
    @State private var selection: FamilyActivitySelection
    let store: SharedDataStore
    let onDismiss: () -> Void

    init(store: SharedDataStore, onDismiss: @escaping () -> Void) {
        self.store = store
        self.onDismiss = onDismiss
        self._selection = State(initialValue: store.savedSelection)
    }

    var body: some View {
        NavigationView {
            FamilyActivityPicker(selection: $selection)
                .navigationTitle("Select Apps to Lock")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) {
                        Button("Cancel") {
                            onDismiss()
                        }
                    }
                    ToolbarItem(placement: .confirmationAction) {
                        Button("Save") {
                            store.savedSelection = selection
                            onDismiss()
                        }
                        .fontWeight(.semibold)
                    }
                }
        }
    }
}
