package com.zyneonstudios.apex.nexapp.window;

import java.io.IOException;
import java.io.InputStream;
import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.SymbolLookup;
import java.lang.invoke.MethodHandle;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

import static java.lang.foreign.ValueLayout.ADDRESS;
import static java.lang.foreign.ValueLayout.JAVA_CHAR;
import static java.lang.foreign.ValueLayout.JAVA_INT;

public final class NativeFileDialog {

    private static final String OS = System.getProperty("os.name").toLowerCase(Locale.ROOT);

    public record Options(String title, String filterName, List<String> extensions, Path directory, String fileName) { }

    public record Result(boolean available, Path path) {
        static final Result UNAVAILABLE = new Result(false, null);
        static final Result CANCELLED = new Result(true, null);
        public boolean cancelled() {
            return available && path == null;
        }
    }

    private NativeFileDialog() { }

    public static Result open(Options options, MemorySegment owner) {
        return show(false, options, owner);
    }

    public static Result save(Options options, MemorySegment owner) {
        return show(true, options, owner);
    }

    private static Result show(boolean save, Options options, MemorySegment owner) {
        try {
            if (OS.contains("win")) return Windows.show(save, options, owner);
            if (OS.contains("mac")) return mac(save, options);
            Result result = zenity(save, options);
            if (!result.available()) result = kdialog(save, options);
            return result;
        } catch (Throwable e) {
            System.err.println("[NativeFileDialog] " + e.getMessage());
            return Result.UNAVAILABLE;
        }
    }

    private static final class Windows {

        private static final int OFN_OVERWRITEPROMPT = 0x00000002;
        private static final int OFN_NOCHANGEDIR = 0x00000008;
        private static final int OFN_PATHMUSTEXIST = 0x00000800;
        private static final int OFN_FILEMUSTEXIST = 0x00001000;
        private static final int OFN_EXPLORER = 0x00080000;
        private static final int COINIT_APARTMENTTHREADED = 0x2;
        private static final int COINIT_DISABLE_OLE1DDE = 0x4;

        private static final long OFN_SIZE = 152;
        private static final int FILE_BUFFER_CHARS = 32768;

        private static final long STRUCT_SIZE = 0;
        private static final long OWNER = 8;
        private static final long FILTER = 24;
        private static final long FILTER_INDEX = 44;
        private static final long FILE = 48;
        private static final long MAX_FILE = 56;
        private static final long INITIAL_DIR = 80;
        private static final long TITLE = 88;
        private static final long FLAGS = 96;
        private static final long DEFAULT_EXTENSION = 104;

        static Result show(boolean save, Options options, MemorySegment owner) throws Throwable {
            Linker linker = Linker.nativeLinker();
            try (Arena arena = Arena.ofConfined()) {
                SymbolLookup comdlg32 = SymbolLookup.libraryLookup("comdlg32", arena);
                SymbolLookup ole32 = SymbolLookup.libraryLookup("ole32", arena);
                MethodHandle dialog = linker.downcallHandle(comdlg32.find(save ? "GetSaveFileNameW" : "GetOpenFileNameW").orElseThrow(),
                        FunctionDescriptor.of(JAVA_INT, ADDRESS));
                MethodHandle coInitialize = linker.downcallHandle(ole32.find("CoInitializeEx").orElseThrow(),
                        FunctionDescriptor.of(JAVA_INT, ADDRESS, JAVA_INT));
                MethodHandle coUninitialize = linker.downcallHandle(ole32.find("CoUninitialize").orElseThrow(),
                        FunctionDescriptor.ofVoid());

                int initialized = (int) coInitialize.invokeExact(MemorySegment.NULL, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE);
                try {
                    MemorySegment file = arena.allocate(FILE_BUFFER_CHARS * 2L, 2);
                    if (save && options.fileName() != null) {
                        byte[] name = options.fileName().getBytes(StandardCharsets.UTF_16LE);
                        if (name.length < file.byteSize() - 2) file.copyFrom(MemorySegment.ofArray(name));
                    }

                    StringBuilder pattern = new StringBuilder();
                    for (String extension : options.extensions()) {
                        if (!pattern.isEmpty()) pattern.append(';');
                        pattern.append("*.").append(extension);
                    }
                    String filter = options.filterName() + " (" + pattern.toString().replace(";", ", ") + ")\0" + pattern + "\0";

                    MemorySegment ofn = arena.allocate(OFN_SIZE, 8);
                    ofn.set(JAVA_INT, STRUCT_SIZE, (int) OFN_SIZE);
                    ofn.set(ADDRESS, OWNER, owner == null ? MemorySegment.NULL : owner);
                    ofn.set(ADDRESS, FILTER, wide(arena, filter));
                    ofn.set(JAVA_INT, FILTER_INDEX, 1);
                    ofn.set(ADDRESS, FILE, file);
                    ofn.set(JAVA_INT, MAX_FILE, FILE_BUFFER_CHARS);
                    if (options.directory() != null) ofn.set(ADDRESS, INITIAL_DIR, wide(arena, options.directory().toString()));
                    if (options.title() != null) ofn.set(ADDRESS, TITLE, wide(arena, options.title()));
                    int flags = OFN_EXPLORER | OFN_NOCHANGEDIR | OFN_PATHMUSTEXIST | (save ? OFN_OVERWRITEPROMPT : OFN_FILEMUSTEXIST);
                    ofn.set(JAVA_INT, FLAGS, flags);
                    if (save && !options.extensions().isEmpty()) ofn.set(ADDRESS, DEFAULT_EXTENSION, wide(arena, options.extensions().getFirst()));

                    int ok = (int) dialog.invokeExact(ofn);
                    if (ok == 0) return Result.CANCELLED;
                    String path = readWide(file);
                    return path.isBlank() ? Result.CANCELLED : new Result(true, Path.of(path));
                } finally {
                    if (initialized >= 0) coUninitialize.invokeExact();
                }
            }
        }

        private static MemorySegment wide(Arena arena, String value) {
            byte[] bytes = (value + "\0").getBytes(StandardCharsets.UTF_16LE);
            MemorySegment segment = arena.allocate(bytes.length, 2);
            segment.copyFrom(MemorySegment.ofArray(bytes));
            return segment;
        }

        private static String readWide(MemorySegment segment) {
            StringBuilder out = new StringBuilder();
            for (long offset = 0; offset + 1 < segment.byteSize(); offset += 2) {
                char c = segment.get(JAVA_CHAR, offset);
                if (c == 0) break;
                out.append(c);
            }
            return out.toString();
        }
    }

    private static Result mac(boolean save, Options options) {
        String location = options.directory() != null ? " default location (POSIX file \"" + escapeAppleScript(options.directory().toString()) + "\")" : "";
        String prompt = " with prompt \"" + escapeAppleScript(options.title() != null ? options.title() : "") + "\"";
        String script;
        if (save) {
            String name = options.fileName() != null ? " default name \"" + escapeAppleScript(options.fileName()) + "\"" : "";
            script = "POSIX path of (choose file name" + prompt + name + location + ")";
        } else {
            StringBuilder types = new StringBuilder();
            for (String extension : options.extensions()) {
                if (!types.isEmpty()) types.append(", ");
                types.append('"').append(escapeAppleScript(extension)).append('"');
                if (extension.equals("png")) types.append(", \"public.png\"");
            }
            script = "POSIX path of (choose file" + prompt + " of type {" + types + "}" + location + ")";
        }
        return run(List.of("osascript", "-e", "tell current application to activate", "-e", script));
    }

    private static String escapeAppleScript(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static String globs(Options options) {
        StringBuilder out = new StringBuilder();
        for (String extension : options.extensions()) {
            if (!out.isEmpty()) out.append(' ');
            out.append("*.").append(extension);
        }
        return out.toString();
    }

    private static Result zenity(boolean save, Options options) {
        List<String> command = new ArrayList<>(List.of("zenity", "--file-selection"));
        if (options.title() != null) command.add("--title=" + options.title());
        command.add("--file-filter=" + options.filterName() + " | " + globs(options));
        if (save) {
            command.add("--save");
            if (options.directory() != null && options.fileName() != null) command.add("--filename=" + options.directory().resolve(options.fileName()));
        } else if (options.directory() != null) {
            command.add("--filename=" + options.directory() + "/");
        }
        return run(command);
    }

    private static Result kdialog(boolean save, Options options) {
        List<String> command = new ArrayList<>(List.of("kdialog"));
        if (options.title() != null) command.addAll(List.of("--title", options.title()));
        command.add(save ? "--getsavefilename" : "--getopenfilename");
        Path start = options.directory();
        if (save && start != null && options.fileName() != null) start = start.resolve(options.fileName());
        command.add(start != null ? start.toString() : System.getProperty("user.home"));
        command.add(globs(options) + "|" + options.filterName());
        return run(command);
    }

    private static Result run(List<String> command) {
        try {
            Process process = new ProcessBuilder(command).start();
            String output;
            try (InputStream stream = process.getInputStream()) {
                output = new String(stream.readAllBytes(), StandardCharsets.UTF_8).trim();
            }
            if (!process.waitFor(30, TimeUnit.MINUTES)) {
                process.destroy();
                return Result.CANCELLED;
            }
            int exitCode = process.exitValue();
            if (exitCode == 0 && !output.isBlank()) return new Result(true, Path.of(output));
            if (exitCode == 1) return Result.CANCELLED;
            return Result.UNAVAILABLE;
        } catch (IOException e) {
            return Result.UNAVAILABLE;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Result.CANCELLED;
        }
    }
}
