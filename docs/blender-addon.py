# TODO
# - dont show LOD Group option when a child of a LOD Group

bl_info = {
    "name": "Hyperfy",
    "author": "Ashxn",
    "version": (1, 0),
    "blender": (2, 80, 0),
    "location": "View3D > Sidebar > Hyperfy Tab",
    "description": "A tool for quickly managing custom properties specific to Hyperfy assets.",
    "warning": "",
    "doc_url": "",
    "category": "3D View",
}

import bpy
from bpy.types import Panel, Operator, PropertyGroup
from bpy.props import BoolProperty, StringProperty, EnumProperty, IntProperty

# Node type options
NODE_NONE = 'none'
NODE_RIGIDBODY = 'rigidbody'
NODE_COLLIDER = 'collider'
NODE_LOD = 'lod'

# Rigidbody type options
TYPE_STATIC = 'static'
TYPE_KINEMATIC = 'kinematic'
TYPE_DYNAMIC = 'dynamic'

class OBJECT_OT_node_type_set(Operator):
    """Set Node Type Property"""
    bl_idname = "object.node_type_set"
    bl_label = "Set Node Type Property"
    bl_options = {'REGISTER', 'UNDO'}
    
    node_type: StringProperty(
        name="Node Type",
        description="Node type to set",
        default=NODE_NONE
    )
    
    # Property to support depressed state for buttons
    depress: BoolProperty(default=False)
    
    @classmethod
    def poll(cls, context):
        return context.active_object is not None
    
    def execute(self, context):
        obj = context.active_object
        
        # If switching away from rigidbody, we should also remove any type property
        was_rigidbody = "node" in obj and obj["node"] == NODE_RIGIDBODY
        
        # If switching away from collider, remove collider-specific properties
        was_collider = "node" in obj and obj["node"] == NODE_COLLIDER
        
        if self.node_type == NODE_NONE:
            # Remove the custom property if it exists
            if "node" in obj:
                del obj["node"]
                
            # Also remove type property if it exists
            if "type" in obj:
                del obj["type"]
                
            # Remove collider properties if they exist
            if "convex" in obj:
                del obj["convex"]
            if "trigger" in obj:
                del obj["trigger"]
        else:
            # Add or set the custom property
            obj["node"] = self.node_type
            
            # If switching to something other than rigidbody, remove type property
            if self.node_type != NODE_RIGIDBODY and "type" in obj:
                del obj["type"]
                
            # If switching to something other than collider, remove collider properties
            if self.node_type != NODE_COLLIDER:
                if "convex" in obj:
                    del obj["convex"]
                if "trigger" in obj:
                    del obj["trigger"]
        
        # Notify Blender that the object has been updated
        obj.update_tag(refresh={'OBJECT'})
        
        # Force update of the UI - including the properties panel
        for area in context.screen.areas:
            area.tag_redraw()
                
        return {'FINISHED'}

class OBJECT_OT_rigidbody_type_set(Operator):
    """Set Rigidbody Type Property"""
    bl_idname = "object.rigidbody_type_set"
    bl_label = "Set Rigidbody Type Property"
    bl_options = {'REGISTER', 'UNDO'}
    
    rb_type: StringProperty(
        name="Rigidbody Type",
        description="Rigidbody type to set",
        default=TYPE_STATIC
    )
    
    @classmethod
    def poll(cls, context):
        obj = context.active_object
        return obj is not None and "node" in obj and obj["node"] == NODE_RIGIDBODY
    
    def execute(self, context):
        obj = context.active_object
        
        if self.rb_type == TYPE_STATIC:
            # Remove the type property if it exists (since static is default)
            if "type" in obj:
                del obj["type"]
        else:
            # Add or set the type property
            obj["type"] = self.rb_type
        
        # Notify Blender that the object has been updated
        obj.update_tag(refresh={'OBJECT'})
        
        # Force update of the UI
        for area in context.screen.areas:
            area.tag_redraw()
                
        return {'FINISHED'}

class OBJECT_OT_collider_property_toggle(Operator):
    """Toggle Collider Property"""
    bl_idname = "object.collider_property_toggle"
    bl_label = "Toggle Collider Property"
    bl_options = {'REGISTER', 'UNDO'}
    
    property_name: StringProperty(
        name="Property Name",
        description="Name of the property to toggle",
        default=""
    )
    
    @classmethod
    def poll(cls, context):
        obj = context.active_object
        return obj is not None and "node" in obj and obj["node"] == NODE_COLLIDER
    
    def execute(self, context):
        obj = context.active_object
        
        # If property exists, toggle its value
        if self.property_name in obj:
            if obj[self.property_name]:
                # If true, remove it (to match engine default)
                del obj[self.property_name]
            else:
                # Toggle to true
                obj[self.property_name] = True
        else:
            # Property doesn't exist, set it to true
            obj[self.property_name] = True
        
        # Notify Blender that the object has been updated
        obj.update_tag(refresh={'OBJECT'})
        
        # Force update of the UI
        for area in context.screen.areas:
            area.tag_redraw()
                
        return {'FINISHED'}

class OBJECT_OT_mesh_property_toggle(Operator):
    """Toggle Mesh Property"""
    bl_idname = "object.mesh_property_toggle"
    bl_label = "Toggle Mesh Property"
    bl_options = {'REGISTER', 'UNDO'}
    
    property_name: StringProperty(
        name="Property Name",
        description="Name of the property to toggle",
        default=""
    )
    
    @classmethod
    def poll(cls, context):
        obj = context.active_object
        return obj is not None and obj.type == 'MESH'
    
    def execute(self, context):
        obj = context.active_object
        
        # If property exists, toggle its value
        if self.property_name in obj:
            # If it's false, delete it to revert to default (true)
            if obj[self.property_name] == False:
                del obj[self.property_name]
            # If it's true already (which shouldn't happen normally), set to false
            else:
                obj[self.property_name] = False
        else:
            # Property doesn't exist (default is true), set it to false 
            obj[self.property_name] = False
        
        # Notify Blender that the object has been updated
        obj.update_tag(refresh={'OBJECT'})
        
        # Force update of the UI
        for area in context.screen.areas:
            area.tag_redraw()
                
        return {'FINISHED'}

class VIEW3D_PT_hyperfy_panel(Panel):
    """Creates a Panel in the N-Panel"""
    bl_label = "Hyperfy"
    bl_idname = "VIEW3D_PT_hyperfy_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Hyperfy'  # This is the tab name
    
    def draw(self, context):
        layout = self.layout
        obj = context.active_object
        
        # Only show UI if an object is selected
        if obj:
            # Get current node type from the object if it exists
            current_node_type = NODE_NONE
            if "node" in obj:
                current_node_type = obj["node"]
            
            layout.label(text="Node")
            
            # Create a vertical list of buttons with clear visual indication of selection
            
            # None button
            row = layout.row()
            if current_node_type == NODE_NONE:
                row.operator("object.node_type_set", text="None", icon='RADIOBUT_ON').node_type = NODE_NONE
            else:
                row.operator("object.node_type_set", text="None", icon='RADIOBUT_OFF').node_type = NODE_NONE
            
            # Rigidbody button
            row = layout.row()
            if current_node_type == NODE_RIGIDBODY:
                row.operator("object.node_type_set", text="Rigidbody", icon='RADIOBUT_ON').node_type = NODE_RIGIDBODY
            else:
                row.operator("object.node_type_set", text="Rigidbody", icon='RADIOBUT_OFF').node_type = NODE_RIGIDBODY
            
            # Collider button
            row = layout.row()
            if current_node_type == NODE_COLLIDER:
                row.operator("object.node_type_set", text="Collider", icon='RADIOBUT_ON').node_type = NODE_COLLIDER
            else:
                row.operator("object.node_type_set", text="Collider", icon='RADIOBUT_OFF').node_type = NODE_COLLIDER
            
            # LOD button
            row = layout.row()
            if current_node_type == NODE_LOD:
                row.operator("object.node_type_set", text="LOD Group", icon='RADIOBUT_ON').node_type = NODE_LOD
            else:
                row.operator("object.node_type_set", text="LOD Group", icon='RADIOBUT_OFF').node_type = NODE_LOD
            
            # If node type is rigidbody, show additional options for rigidbody type
            if current_node_type == NODE_RIGIDBODY:
                # Get current rigidbody type if it exists
                current_rb_type = TYPE_STATIC
                if "type" in obj:
                    current_rb_type = obj["type"]
                
                # Add a separator
                layout.separator()
                
                # Add a title for the rigidbody type section
                layout.label(text="Rigidbody Type")
                
                # Static button
                row = layout.row()
                if current_rb_type == TYPE_STATIC:
                    row.operator("object.rigidbody_type_set", text="Static", icon='RADIOBUT_ON').rb_type = TYPE_STATIC
                else:
                    row.operator("object.rigidbody_type_set", text="Static", icon='RADIOBUT_OFF').rb_type = TYPE_STATIC
                
                # Kinematic button
                row = layout.row()
                if current_rb_type == TYPE_KINEMATIC:
                    row.operator("object.rigidbody_type_set", text="Kinematic", icon='RADIOBUT_ON').rb_type = TYPE_KINEMATIC
                else:
                    row.operator("object.rigidbody_type_set", text="Kinematic", icon='RADIOBUT_OFF').rb_type = TYPE_KINEMATIC
                
                # Dynamic button
                row = layout.row()
                if current_rb_type == TYPE_DYNAMIC:
                    row.operator("object.rigidbody_type_set", text="Dynamic", icon='RADIOBUT_ON').rb_type = TYPE_DYNAMIC
                else:
                    row.operator("object.rigidbody_type_set", text="Dynamic", icon='RADIOBUT_OFF').rb_type = TYPE_DYNAMIC
            
            # If node type is collider, show collider options
            elif current_node_type == NODE_COLLIDER:
                # Add a separator
                layout.separator()
                
                # Add a title for the collider options section
                layout.label(text="Collider Options")
                
                # Check if properties exist and set the checkbox state accordingly
                is_convex = "convex" in obj and obj["convex"] == True
                is_trigger = "trigger" in obj and obj["trigger"] == True
                
                # Convex checkbox
                row = layout.row()
                op = row.operator("object.collider_property_toggle", text="Convex", icon='CHECKBOX_HLT' if is_convex else 'CHECKBOX_DEHLT')
                op.property_name = "convex"
                
                # Trigger checkbox
                row = layout.row()
                op = row.operator("object.collider_property_toggle", text="Trigger", icon='CHECKBOX_HLT' if is_trigger else 'CHECKBOX_DEHLT')
                op.property_name = "trigger"
            
            # Check if object is a child of an LOD node
            parent = obj.parent
            is_lod_child = parent and "node" in parent and parent["node"] == NODE_LOD
            
            # If this is a child of an LOD node, show max distance option
            if is_lod_child:
                layout.separator()
                layout.label(text="LOD")
                layout.prop(obj, "hyperfy_max_distance")
            
            # If object is a mesh, show mesh options regardless of node type
            if obj.type == 'MESH':
                # Add a separator
                layout.separator()
                
                # Add a title for the mesh options section
                layout.label(text="Mesh")
                
                # Check if properties exist and set the checkbox state accordingly
                # For castShadow and receiveShadow, they are true by default
                # So they should appear checked unless explicitly set to false
                cast_shadow = not ("castShadow" in obj and obj["castShadow"] == False)
                receive_shadow = not ("receiveShadow" in obj and obj["receiveShadow"] == False)
                
                # Cast Shadow checkbox
                row = layout.row()
                op = row.operator("object.mesh_property_toggle", text="Cast Shadow", icon='CHECKBOX_HLT' if cast_shadow else 'CHECKBOX_DEHLT')
                op.property_name = "castShadow"
                
                # Receive Shadow checkbox
                row = layout.row()
                op = row.operator("object.mesh_property_toggle", text="Receive Shadow", icon='CHECKBOX_HLT' if receive_shadow else 'CHECKBOX_DEHLT')
                op.property_name = "receiveShadow"
                
        else:
            layout.label(text="No object selected")

# Registration
classes = (
    OBJECT_OT_node_type_set,
    OBJECT_OT_rigidbody_type_set,
    OBJECT_OT_collider_property_toggle,
    OBJECT_OT_mesh_property_toggle,
    VIEW3D_PT_hyperfy_panel,
)

def get_max_distance(self):
    # return stored value or 0 if missing
    return self.get("maxDistance", 0)

def set_max_distance(self, value):
    # writing zero = remove the ID-property
    if value == 0:
        if "maxDistance" in self:
            del self["maxDistance"]
    else:
        self["maxDistance"] = value
    # tag update so the UI refreshes
    self.update_tag(refresh={'OBJECT'})
    for area in bpy.context.screen.areas:
        area.tag_redraw()

def register():
    # register our “proxy” property on all Objects
    bpy.types.Object.hyperfy_max_distance = IntProperty(
        name="Max Distance",
        description="Maximum LOD distance (0 = no limit)",
        get=get_max_distance,
        set=set_max_distance,
    )
    for cls in classes:
        bpy.utils.register_class(cls)

def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
    # clean up our proxy property
    del bpy.types.Object.hyperfy_max_distance

if __name__ == "__main__":
    register()