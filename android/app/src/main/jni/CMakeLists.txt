# Custom CMakeLists for appmodules target.
# Based on react-native/ReactAndroid/cmake-utils/default-app-setup/CMakeLists.txt.
#
# We override the entry point to add `c++abi` to the link libraries, which
# fixes "undefined symbol: operator delete(void*, std::align_val_t)" and
# "undefined symbol: vtable for __cxxabiv1::__class_type_info" on
# Windows + NDK 27 + RN 0.87 (the autolinked appmodules target doesn't
# link libc++abi by default in that toolchain combo).

cmake_minimum_required(VERSION 3.13)

project(appmodules)

include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

# Workaround RN 0.87 + NDK 27 en Windows: forzar el enlace de libc++abi
# y libc++ para que se resuelvan los símbolos de RTTI / operator delete.
target_link_libraries(${CMAKE_PROJECT_NAME} c++ c++abi)
